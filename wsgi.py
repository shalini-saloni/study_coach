"""WSGI entry point for deployment."""
import sys
import os

# Add the project root to the path
sys.path.insert(0, os.path.dirname(__file__))

from src.api import app, load_model

# Load model when wsgi starts (but don't fail if it doesn't exist)
try:
    load_model()
except Exception as e:
    print(f"Warning: Could not load model at startup: {e}")
    print("App will use fallback predictions")

