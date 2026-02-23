"""WSGI entry point for deployment."""
import sys
import os

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.api import app, load_model

# Load model when wsgi starts
load_model()

if __name__ == "__main__":
    app.run()
