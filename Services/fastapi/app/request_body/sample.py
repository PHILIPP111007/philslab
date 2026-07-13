from typing import Optional

from pydantic import BaseModel


class SampleCreate(BaseModel):
    zlims_id: Optional[str]
    some_number: Optional[int]
    descr: Optional[str]


class SampleUpdate(BaseModel):
    zlims_id: Optional[str]
    some_number: Optional[int]
    descr: Optional[str]
