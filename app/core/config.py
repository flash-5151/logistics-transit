from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, computed_field


class Settings(BaseSettings):
    PROJECT_NAME: str = "FastAPI App"
    VERSION: str = "0.1.0"
    API_STR: str = "/api/v1"

    # security
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = Field("HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(60 * 24 * 8, env="ACCESS_TOKEN_EXPIRE_MINUTES")

    # database components (use env vars to override)
    DB_USER: str = Field("chakri", env="DB_USER")
    DB_PASSWORD: str = Field("", env="DB_PASSWORD")
    DB_HOST: str = Field("localhost", env="DB_HOST")
    DB_PORT: int = Field(5432, env="DB_PORT")
    DB_NAME: str = Field("fastapi_issue_tracker_db", env="DB_NAME")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @computed_field
    def DATABASE_URL(self) -> str:
        # build DB URL from individual fields; safe if password is empty
        user = self.DB_USER
        pwd = self.DB_PASSWORD
        host = self.DB_HOST
        port = self.DB_PORT
        name = self.DB_NAME
        if pwd:
            return f"postgresql+asyncpg://{user}:{pwd}@{host}:{port}/{name}"
        return f"postgresql+asyncpg://{user}@{host}:{port}/{name}"


# single settings instance used across the app
settings = Settings()
