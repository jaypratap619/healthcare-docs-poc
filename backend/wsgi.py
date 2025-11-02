"""
WSGI entry point for production deployment (Gunicorn)
"""
from backend.app import create_app

app = create_app()

if __name__ == "__main__":
    app.run()

