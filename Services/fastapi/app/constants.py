from os import environ

SECRET_KEY: str = environ.get("SECRET_KEY", "1234")

DATETIME_FORMAT: str = environ.get("DATETIME_FORMAT", "%Y-%m-%d %H:%M")

PG_HOST = environ.get("PG_HOST", "db")
PG_PORT = environ.get("PG_PORT", "5432")
PG_NAME = environ.get("PG_NAME", "postgres")
PG_USER = environ.get("PG_USER", "postgres")
PG_PASSWORD = environ.get("PG_PASSWORD", "postgres")

TESTING = environ.get("TESTING", "0")
DEVELOPMENT = environ.get("DEVELOPMENT", "0")

API_VERSION = 2
API_PREFIX = f"/api/v{API_VERSION}"
