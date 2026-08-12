from datetime import datetime

from pydantic import BaseModel

from app.enums.priority import Priority


class TaskCreate(BaseModel):
    name: str
    description: str | None = ""
    deadline: datetime | None = None
    priority: Priority = Priority.medium
    assigned_to_id: int | None = None
    protocol_id: int | None = None
    department: str | None = ""  # ✅ Добавлено
    batch_ids: list[int] | None = None


class TaskUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    deadline: datetime | None = None
    priority: Priority | None = None
    is_completed: bool | None = None
    assigned_to_id: int | None = None
    protocol_id: int | None = None
    stage_ids: list[int] | None = None
    department: str | None = None  # ✅ Добавлено
    batch_ids: list[int] | None = None


class StageCreate(BaseModel):
    name: str
    description: str | None = ""
    order: int | None = 0
    protocol_id: int | None = None


class StageUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_completed: bool | None = None
    order: int | None = None


class SampleCreateFull(BaseModel):
    name: str
    type: str
    description: str | None = ""
    collection_date: datetime | None = None
    storage_location: str | None = ""
    quantity: float | None = None
    unit: str | None = ""


class SampleUpdateFull(BaseModel):
    name: str | None = None
    type: str | None = None
    description: str | None = None
    collection_date: datetime | None = None
    storage_location: str | None = None
    quantity: float | None = None
    unit: str | None = None


class ProtocolCreate(BaseModel):
    name: str
    code: str
    description: str | None = ""
    version: str | None = "1.0"


class ProtocolUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None
    version: str | None = None
