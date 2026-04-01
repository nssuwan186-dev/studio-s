"""
Configuration Settings
"""
import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App
    APP_NAME: str = "VIPAT Hotel"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./vipat_hotel.db"
    
    # JWT
    SECRET_KEY: str = "vipat-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # AI
    OPENAI_API_KEY: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    
    class Config:
        env_file = ".env"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Override DATABASE_URL if environment variables are set
        url = os.getenv("DATABASE_URL", "")
        if url:
            self.DATABASE_URL = url
        elif os.getenv("DB_HOST"):
            user = os.getenv("DB_USER", "root")
            pw = os.getenv("DB_PASSWORD", "")
            host = os.getenv("DB_HOST", "localhost")
            port = os.getenv("DB_PORT", "3306")
            name = os.getenv("DB_NAME", "vipat_hotel")
            self.DATABASE_URL = f"mysql+pymysql://{user}:{pw}@{host}:{port}/{name}"
