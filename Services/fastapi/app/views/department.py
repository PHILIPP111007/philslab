# views/batch.py
from fastapi import APIRouter, Request

from app.enums.department import Departments

router = APIRouter(tags=["department"])


@router.get("/departments/")
async def get_departments(request: Request):
    """Возвращает список доступных отделов (значения enum Departments)."""
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    return {"ok": True, "data": [dept.value for dept in Departments]}
