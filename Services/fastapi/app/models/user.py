__all__ = ["User"]

from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .group import Group
    from .protocol import Protocol
    from .query_history import QueryHistory
    from .sample import Sample
    from .task import Task
    from .token import Token

from .group import UserGroupLink


class User(SQLModel, table=True):
    __tablename__ = "app_user"

    id: int = Field(primary_key=True)
    username: str = Field(max_length=150, unique=True, index=True)
    email: str = Field(max_length=254, unique=True, index=True)
    first_name: str = Field(max_length=150, default="")
    last_name: str = Field(max_length=150, default="")
    descr: str = Field(default="")
    department: str = Field(default="")

    # Связи
    tokens: list["Token"] = Relationship(back_populates="user")

    # Образцы
    samples: list["Sample"] = Relationship(back_populates="user")

    # Батчи
    batches: list["Batch"] = Relationship(back_populates="user")

    # Протоколы, созданные пользователем
    created_protocols: list["Protocol"] = Relationship(back_populates="created_by")

    # Задачи, созданные пользователем
    created_tasks: list["Task"] = Relationship(
        back_populates="created_by",
        sa_relationship_kwargs={"foreign_keys": "[Task.created_by_id]"},
    )

    # Задачи, назначенные пользователю
    assigned_tasks: list["Task"] = Relationship(
        back_populates="assigned_to",
        sa_relationship_kwargs={"foreign_keys": "[Task.assigned_to_id]"},
    )

    # История изменений
    history_entries: list["QueryHistory"] = Relationship(back_populates="user")

    # Django auth groups (User.groups)
    groups: list["Group"] = Relationship(
        back_populates="users",
        link_model=UserGroupLink,
    )
