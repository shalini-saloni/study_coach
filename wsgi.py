"""WSGI entry point for deployment."""
import sys
import os

# Add the project root to the path
sys.path.insert(0, os.path.dirname(__file__))

from src.api import app, load_model

# Load model when wsgi starts
load_model()
