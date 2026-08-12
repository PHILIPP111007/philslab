from pydantic import BaseModel


class BatchCreate(BaseModel):
    name: str | None = None
    department: str | None = ""
    descr: str | None = None


class BatchUpdate(BaseModel):
    name: str | None = None
    department: str | None = None
    descr: str | None = None
