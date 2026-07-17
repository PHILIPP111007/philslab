from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.models import Priority


class TaskCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    deadline: Optional[datetime] = None
    priority: Priority = Priority.medium
    assigned_to_id: Optional[int] = None
    protocol_id: Optional[int] = None
    sample_ids: Optional[List[int]] = []
    department: Optional[str] = ""  # ✅ Добавлено
    batch_ids: Optional[List[int]] = []  # ✅ Добавляем


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[Priority] = None
    is_completed: Optional[bool] = None
    assigned_to_id: Optional[int] = None
    protocol_id: Optional[int] = None
    stage_ids: Optional[List[int]] = None
    department: Optional[str] = None  # ✅ Добавлено
    batch_ids: Optional[List[int]] = None


class StageCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    order: Optional[int] = 0


class StageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    order: Optional[int] = None


class SampleCreateFull(BaseModel):
    name: str
    type: str
    description: Optional[str] = ""
    collection_date: Optional[datetime] = None
    storage_location: Optional[str] = ""
    quantity: Optional[float] = None
    unit: Optional[str] = ""


class SampleUpdateFull(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    collection_date: Optional[datetime] = None
    storage_location: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None


class ProtocolCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = ""
    version: Optional[str] = "1.0"


class ProtocolUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None
