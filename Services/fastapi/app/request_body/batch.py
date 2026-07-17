from typing import Optional

from pydantic import BaseModel


class BatchCreate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = ""
    descr: Optional[str] = None


class BatchUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    descr: Optional[str] = None
