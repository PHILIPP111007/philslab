from typing import Optional

from pydantic import BaseModel


class SampleCreate(BaseModel):
    """Схема для создания нового образца."""

    sample_code: Optional[str] = None
    sample_group_code: Optional[str] = None
    zlims_code: Optional[str] = None
    uin1: Optional[str] = None
    uin2: Optional[str] = None
    project_code: Optional[str] = None
    sample_index: Optional[str] = None
    name: Optional[str] = None
    some_number: Optional[int] = None
    qc_1: Optional[float] = None
    qc_2: Optional[float] = None
    descr: Optional[str] = None
    material_type: Optional[str] = None


class SampleUpdate(BaseModel):
    """Схема для обновления образца."""

    sample_code: Optional[str] = None
    sample_group_code: Optional[str] = None
    zlims_code: Optional[str] = None
    uin1: Optional[str] = None
    uin2: Optional[str] = None
    project_code: Optional[str] = None
    sample_index: Optional[str] = None
    name: Optional[str] = None
    some_number: Optional[int] = None
    qc_1: Optional[float] = None
    qc_2: Optional[float] = None
    descr: Optional[str] = None
    material_type: Optional[str] = None
