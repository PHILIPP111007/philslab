from pydantic import BaseModel


class UserBody(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    descr: str | None = None
    department: str | None = None
