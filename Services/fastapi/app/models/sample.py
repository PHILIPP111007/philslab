__all__ = ["Sample"]


from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel


class Sample(SQLModel, table=True):
    __tablename__ = "app_sample"

    id: int = Field(primary_key=True)
    timestamp: datetime = Field(default_factory=lambda: datetime.now())
    content: str
    user_id: int = Field(foreign_key="app_user.id", index=True)
    user: "User" = Relationship(back_populates="samples")
