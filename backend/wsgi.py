"""
WSGI entry point for production deployment (Gunicorn)
"""
import sys
import os

# When running from backend directory, add parent to path so backend can be imported as package
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from backend.app import create_app

app = create_app()

if __name__ == "__main__":
    app.run()

