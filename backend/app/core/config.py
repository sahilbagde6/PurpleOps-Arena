from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://purpleops:changeme@localhost:5432/purpleops"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ANTHROPIC_API_KEY: str = ""
    CALDERA_URL: str = "http://localhost:8888"
    CALDERA_API_KEY: str = "ADMIN123"
    LAB_NETWORK: str = "10.0.0.0/24"

    class Config:
        env_file = ".env"


settings = Settings()
