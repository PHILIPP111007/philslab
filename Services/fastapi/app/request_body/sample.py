from typing import Optional

from pydantic import BaseModel, field_validator


def empty_number_to_none(value):
    return None if value == "" else value


class SampleCreate(BaseModel):
    """Схема для создания нового образца."""

    sample_code: Optional[str] = None
    sample_group_code: Optional[str] = None
    zlims_code: Optional[str] = None
    uin1: Optional[str] = None
    uin2: Optional[str] = None
    project_code: Optional[str] = None
    sample_index: Optional[str] = None
    qc_1: Optional[float] = None
    qc_2: Optional[float] = None
    descr: Optional[str] = None
    material_type: Optional[str] = None

    _normalize_qc_values = field_validator("qc_1", "qc_2", mode="before")(
        empty_number_to_none
    )


class SampleUpdate(BaseModel):
    """Схема для обновления образца."""

    sample_code: Optional[str] = None
    sample_group_code: Optional[str] = None
    zlims_code: Optional[str] = None
    uin1: Optional[str] = None
    uin2: Optional[str] = None
    project_code: Optional[str] = None
    sample_index: Optional[str] = None
    qc_1: Optional[float] = None
    qc_2: Optional[float] = None
    descr: Optional[str] = None
    material_type: Optional[str] = None

    _normalize_qc_values = field_validator("qc_1", "qc_2", mode="before")(
        empty_number_to_none
    )
