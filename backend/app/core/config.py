"""
Configuration Settings
"""
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App
    APP_NAME: str = "VIPAT Hotel"
    DEBUG: bool = True
    
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "vipat_hotel"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    
    @property
    def DATABASE_URL(self) -> str:
        if self.DB_USER == "root" and self.DB_PASSWORD == "":
            return "sqlite:///./vipat_hotel.db"
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    # JWT
    SECRET_KEY: str = "vipat-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # AI
    OPENAI_API_KEY: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
