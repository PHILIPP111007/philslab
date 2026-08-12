from pydantic import BaseModel, field_validator

from app.enums.material_type import MaterialType


def empty_number_to_none(value):
    return None if value == "" else value


class SampleCreate(BaseModel):
    """Схема для создания нового образца."""

    sample_code: str | None = None
    sample_group_code: str | None = None
    zlims_code: str | None = None
    uin1: str | None = None
    uin2: str | None = None
    project_code: str | None = None
    sample_index: str | None = None
    qc_1: float | None = None
    qc_2: float | None = None
    descr: str | None = None
    material_type: MaterialType | None = None

    _normalize_qc_values = field_validator("qc_1", "qc_2", mode="before")(
        empty_number_to_none
    )


class SampleUpdate(BaseModel):
    """Схема для обновления образца."""

    sample_code: str | None = None
    sample_group_code: str | None = None
    zlims_code: str | None = None
    uin1: str | None = None
    uin2: str | None = None
    project_code: str | None = None
    sample_index: str | None = None
    qc_1: float | None = None
    qc_2: float | None = None
    descr: str | None = None
    material_type: MaterialType | None = None

    _normalize_qc_values = field_validator("qc_1", "qc_2", mode="before")(
        empty_number_to_none
    )
