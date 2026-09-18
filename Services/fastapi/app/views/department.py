# views/batch.py
from fastapi import APIRouter, Request

from app.backend.decorators import require_authenticated
from app.enums.department import Departments

router = APIRouter(tags=["department"])


@router.get("/departments/")
@require_authenticated
async def get_departments(request: Request):
    """Возвращает список доступных отделов (значения enum Departments)."""
    return {"ok": True, "data": [dept.value for dept in Departments]}
