"""Configuration module for the Trax AI service."""

import os
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CACHE_TTL = int(os.getenv("AI_CACHE_TTL", "300"))
LOG_LEVEL = os.getenv("AI_LOG_LEVEL", "INFO")
MODEL_DIR = os.getenv("AI_MODEL_DIR", os.path.join(os.path.dirname(__file__), "..", "models", "saved"))
