from typing import Optional

from pydantic import BaseModel


class SubsampleCreate(BaseModel):
    """Схема для создания нового подобразца."""

    sample_code: Optional[str] = None
    sample_group_code: Optional[str] = None
    name: Optional[str] = None
    some_number: Optional[int] = None
    qc_1: Optional[float] = None
    qc_2: Optional[float] = None
    descr: Optional[str] = None
    # sample_id передаётся отдельно, так как это внешний ключ
    sample_id: int  # обязательное поле


class SubsampleUpdate(BaseModel):
    sample_code: Optional[str] = None
    sample_group_code: Optional[str] = None
    name: Optional[str] = None
    some_number: Optional[int] = None
    qc_1: Optional[float] = None
    qc_2: Optional[float] = None
    descr: Optional[str] = None
