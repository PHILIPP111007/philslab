from typing import Optional

from pydantic import BaseModel


class UserBody(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    descr: Optional[str] = None
    department: Optional[str] = None
