from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "TrustLink AI Service"
    model_name: str = "all-MiniLM-L6-v2"
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"
    cors_origins: str = "http://localhost:3000,http://localhost:4000"

    class Config:
        env_file = ".env"
        env_prefix = "AI_"


settings = Settings()
