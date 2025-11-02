import os
import uuid
from flask import Flask, jsonify, request, send_file, abort, g
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge

from .config import Config
from .database import db
from .models import Document, User
from .auth import require_auth
import bcrypt
import jwt


ALLOWED_MIME_TYPES = {"application/pdf"}


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)
    
    # Enable CORS for all routes (adjust origins for production)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Ensure storage directory exists
    os.makedirs(app.config["STORAGE_DIR"], exist_ok=True)

    db.init_app(app)
    with app.app_context():
        db.create_all()
        _ensure_schema()
        _ensure_admin_user()

    @app.errorhandler(RequestEntityTooLarge)
    def handle_large_file(_e):
        return jsonify({"error": "File too large. Max 10 MB."}), 413

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"})

    @app.route("/api/auth/signup", methods=["POST"]) 
    def signup():
        data = request.get_json(silent=True) or {}
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        if not email or not password:
            return jsonify({"error": "email and password required"}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "email already exists"}), 409
        pw_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        user = User(email=email, password_hash=pw_hash)
        db.session.add(user)
        db.session.commit()
        return jsonify({"status": "created"}), 201

    @app.route("/api/auth/login", methods=["POST"]) 
    def login():
        data = request.get_json(silent=True) or {}
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        if not email or not password:
            return jsonify({"error": "email and password required"}), 400
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "invalid credentials"}), 401
        if not bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8")):
            return jsonify({"error": "invalid credentials"}), 401
        # Promote admin account by email if needed
        if user.email == 'admin@gmail.com' and user.role != 'admin':
            user.role = 'admin'
            db.session.commit()
        token = jwt.encode({"sub": user.id}, app.config["SECRET_KEY"], algorithm="HS256")
        return jsonify({"token": token, "user": {"id": user.id, "email": user.email}})

    @app.route("/api/documents", methods=["GET"])
    @require_auth
    def list_documents():
        patient_id = request.headers.get("X-Patient-Id")
        user = User.query.get(g.user_id)
        query = Document.query
        if user and user.role != 'admin':
            query = query.filter_by(user_id=g.user_id)
            if patient_id:
                query = query.filter_by(patient_id=patient_id)
        docs = query.order_by(Document.created_at.desc()).all()
        return jsonify([d.to_dict() for d in docs])

    @app.route("/api/documents/upload", methods=["POST"])
    @require_auth
    def upload_document():
        patient_id = request.headers.get("X-Patient-Id") or str(g.user_id)
        if "file" not in request.files:
            return jsonify({"error": "No file part"}), 400
        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No selected file"}), 400

        # Validate content type if provided by client
        content_type = file.mimetype or ""
        if content_type not in ALLOWED_MIME_TYPES:
            return jsonify({"error": "Only PDF files are allowed"}), 400

        original_filename = secure_filename(file.filename)
        # Prevent duplicate uploads by filename per user
        existing = Document.query.filter_by(user_id=g.user_id, original_filename=original_filename).first()
        if existing:
            return jsonify({"error": "Document with this filename already exists"}), 409
        stored_name = f"{uuid.uuid4().hex}.pdf"
        storage_path = os.path.join(app.config["STORAGE_DIR"], stored_name)

        # Save to disk
        file.save(storage_path)
        size_bytes = os.path.getsize(storage_path)
        if size_bytes > app.config["MAX_CONTENT_LENGTH"]:
            try:
                os.remove(storage_path)
            except OSError:
                pass
            return jsonify({"error": "File too large. Max 10 MB."}), 413

        # Persist metadata
        doc = Document(
            patient_id=patient_id,
            original_filename=original_filename,
            stored_filename=stored_name,
            content_type=content_type,
            size_bytes=size_bytes,
            user_id=g.user_id,
        )
        db.session.add(doc)
        db.session.commit()

        return jsonify(doc.to_dict()), 201

    @app.route("/api/documents/<int:doc_id>/download", methods=["GET"])
    @require_auth
    def download_document(doc_id: int):
        patient_id = request.headers.get("X-Patient-Id")
        doc = Document.query.get_or_404(doc_id)
        user = User.query.get(g.user_id)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        if user.role != 'admin' and doc.user_id != user.id:
            return jsonify({"error": "Forbidden"}), 403
        storage_path = os.path.join(app.config["STORAGE_DIR"], doc.stored_filename)
        if not os.path.exists(storage_path):
            return jsonify({"error": "File not found on disk"}), 410
        return send_file(
            storage_path,
            mimetype=doc.content_type,
            as_attachment=True,
            download_name=doc.original_filename,
        )

    @app.route("/api/documents/<int:doc_id>", methods=["DELETE"])
    @require_auth
    def delete_document(doc_id: int):
        patient_id = request.headers.get("X-Patient-Id")
        doc = Document.query.get_or_404(doc_id)
        user = User.query.get(g.user_id)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        if user.role != 'admin' and doc.user_id != user.id:
            return jsonify({"error": "Forbidden"}), 403
        storage_path = os.path.join(app.config["STORAGE_DIR"], doc.stored_filename)
        try:
            if os.path.exists(storage_path):
                os.remove(storage_path)
        except OSError:
            # If we fail to delete the file, we still remove metadata to avoid dangling records
            pass
        db.session.delete(doc)
        db.session.commit()
        return jsonify({"status": "deleted"})

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)


def _ensure_schema():
    from sqlalchemy import text
    # Add user_id to documents if missing
    info = db.session.execute(text("PRAGMA table_info(documents)")).fetchall()
    cols = {row[1] for row in info}
    if 'user_id' not in cols:
        db.session.execute(text("ALTER TABLE documents ADD COLUMN user_id INTEGER"))
        db.session.commit()
    # Add role to users if missing
    info_u = db.session.execute(text("PRAGMA table_info(users)")).fetchall()
    cols_u = {row[1] for row in info_u}
    if 'role' not in cols_u:
        db.session.execute(text("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' NOT NULL"))
        db.session.commit()
    # Unique index to prevent duplicate filenames per user
    db.session.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_user_filename ON documents(user_id, original_filename)"))
    db.session.commit()


def _ensure_admin_user():
    admin = User.query.filter_by(email='admin@gmail.com').first()
    if not admin:
        pw_hash = bcrypt.hashpw(b"admin", bcrypt.gensalt()).decode("utf-8")
        admin = User(email='admin@gmail.com', password_hash=pw_hash, role='admin')
        db.session.add(admin)
        db.session.commit()
    else:
        if admin.role != 'admin':
            admin.role = 'admin'
            db.session.commit()


