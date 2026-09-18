"""FastAPI mappings for Django's auth groups and User.groups relation."""

from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .user import User


class UserGroupLink(SQLModel, table=True):
    """Existing Django many-to-many table for ``User.groups``."""

    __tablename__ = "app_user_groups"

    user_id: int = Field(foreign_key="app_user.id", primary_key=True)
    group_id: int = Field(foreign_key="auth_group.id", primary_key=True)


class Group(SQLModel, table=True):
    """Existing Django ``auth_group`` table."""

    __tablename__ = "auth_group"

    id: int = Field(primary_key=True)
    name: str = Field(max_length=150, unique=True, index=True)

    users: list["User"] = Relationship(
        back_populates="groups",
        link_model=UserGroupLink,
    )
