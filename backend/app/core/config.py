import os
from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import field_validator

class Settings(BaseSettings):
    APP_NAME: str = "REHABTRACK GEE Analytics Service"
    APP_ENV: str = "development"
    API_V1_STR: str = "/api/v1"
    
    # Supabase Cloud Configuration
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    
    # Google Earth Engine Credentials
    GEE_SERVICE_ACCOUNT_EMAIL: str = ""
    GEE_PRIVATE_KEY_JSON: str = ""
    GEE_PROJECT_ID: str = ""
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        return ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
