__all__ = ["User"]

from typing import TYPE_CHECKING, List

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .protocol import Protocol
    from .query_history import QueryHistory
    from .sample import Sample
    from .task import Task
    from .token import Token


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
    tokens: List["Token"] = Relationship(back_populates="user")

    # Образцы
    samples: List["Sample"] = Relationship(back_populates="user")

    # Подобразцы
    subsamples: List["Subsample"] = Relationship(back_populates="user")

    # Батчи
    batches: List["Batch"] = Relationship(back_populates="user")

    # Протоколы, созданные пользователем
    created_protocols: List["Protocol"] = Relationship(back_populates="created_by")

    # Задачи, созданные пользователем
    created_tasks: List["Task"] = Relationship(
        back_populates="created_by",
        sa_relationship_kwargs={"foreign_keys": "[Task.created_by_id]"},
    )

    # Задачи, назначенные пользователю
    assigned_tasks: List["Task"] = Relationship(
        back_populates="assigned_to",
        sa_relationship_kwargs={"foreign_keys": "[Task.assigned_to_id]"},
    )

    # История изменений
    history_entries: List["QueryHistory"] = Relationship(back_populates="user")
