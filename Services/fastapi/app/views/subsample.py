# views/subsample.py

from datetime import datetime

from fastapi import APIRouter, Query, Request
from sqlalchemy.orm import selectinload
from sqlmodel import func, select

from app.database import SessionDep
from app.models import Sample, Subsample
from app.request_body import SubsampleCreate, SubsampleUpdate

router = APIRouter(tags=["subsample"])


@router.get("/subsamples/")
async def get_subsamples(
    session: SessionDep,
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = Query(None),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    search: str = Query(None),
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    statement = select(Subsample).options(selectinload(Subsample.sample))

    if search:
        statement = statement.where(
            (Subsample.sample_code.contains(search))
            | (Subsample.name.contains(search))
            | (Subsample.descr.contains(search))
        )

    # Сортировка
    if sort_by and hasattr(Subsample, sort_by):
        column = getattr(Subsample, sort_by)
        statement = statement.order_by(
            column.desc() if sort_order == "desc" else column.asc()
        )

    statement = statement.order_by(Subsample.timestamp.desc())

    offset = (page - 1) * page_size
    total = (
        await session.exec(select(func.count()).select_from(statement.subquery()))
    ).one()
    statement = statement.offset(offset).limit(page_size)
    subsamples = (await session.exec(statement)).all()

    return {
        "ok": True,
        "data": subsamples,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/subsample/{subsample_id}/")
async def get_subsample(
    session: SessionDep,
    request: Request,
    subsample_id: int,
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    subsample = await session.get(
        Subsample,
        subsample_id,
        options=[selectinload(Subsample.sample)],
    )
    if not subsample:
        return {"ok": False, "error": "Not found subsample."}

    return {"ok": True, "data": subsample}


@router.post("/subsample/")
async def create_subsample(
    session: SessionDep,
    request: Request,
    subsample_data: SubsampleCreate,
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    # Проверяем, что родительский образец существует
    sample = await session.get(Sample, subsample_data.sample_id)
    if not sample:
        return {"ok": False, "error": "Sample not found."}

    subsample = Subsample(
        sample_id=subsample_data.sample_id,
        sample_code=subsample_data.sample_code,
        name=subsample_data.name,
        some_number=subsample_data.some_number,
        qc_1=subsample_data.qc_1,
        qc_2=subsample_data.qc_2,
        descr=subsample_data.descr,
        user_id=request.state.user.id,
    )

    session.add(subsample)
    await session.commit()
    await session.refresh(subsample)

    return {"ok": True, "data": subsample}


@router.put("/subsample/{subsample_id}/")
async def put_subsample(
    session: SessionDep,
    request: Request,
    subsample_id: int,
    subsample_data: SubsampleUpdate,
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    subsample = await session.get(Subsample, subsample_id)
    if not subsample:
        return {"ok": False, "error": "Not found subsample."}

    update_data = subsample_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(subsample, field, value)

    subsample.updated_at = datetime.now()
    session.add(subsample)
    await session.commit()
    await session.refresh(subsample)

    return {"ok": True, "data": subsample}


@router.delete("/subsample/{subsample_id}/")
async def delete_subsample(
    session: SessionDep,
    request: Request,
    subsample_id: int,
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    subsample = await session.get(Subsample, subsample_id)
    if not subsample:
        return {"ok": False, "error": "Not found subsample."}

    await session.delete(subsample)
    await session.commit()
    return {"ok": True}


@router.get("/subsamples/export/")
async def export_subsamples(
    session: SessionDep,
    request: Request,
    search: str = Query(None),
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    # Извлекаем все фильтры из query params
    filters = {}
    for key, value in request.query_params.items():
        if key.startswith("filter[") and key.endswith("]"):
            field_name = key[len("filter[") : -1]
            filters[field_name] = value

    statement = select(Subsample)

    if search:
        statement = statement.where(
            (Subsample.sample_code.contains(search))
            | (Subsample.name.contains(search))
            | (Subsample.descr.contains(search))
        )

    for field, value in filters.items():
        if not hasattr(Subsample, field):
            continue
        column = getattr(Subsample, field)
        if field in ("some_number", "qc_1", "qc_2", "sample_id", "user_id"):
            try:
                if "." in value:
                    num_val = float(value)
                else:
                    num_val = int(value)
                statement = statement.where(column == num_val)
            except ValueError:
                pass
        else:
            statement = statement.where(column.ilike(f"%{value}%"))

    sort_by = request.query_params.get("sort_by")
    sort_order = request.query_params.get("sort_order", "asc")
    if sort_by and hasattr(Subsample, sort_by):
        column = getattr(Subsample, sort_by)
        statement = statement.order_by(
            column.desc() if sort_order == "desc" else column.asc()
        )
    else:
        statement = statement.order_by(Subsample.timestamp.desc())

    subsamples = (await session.exec(statement)).all()

    result = []
    for s in subsamples:
        result.append(
            {
                "id": s.id,
                "sample_id": s.sample_id,
                "sample_code": s.sample_code,
                "name": s.name,
                "some_number": s.some_number,
                "qc_1": s.qc_1,
                "qc_2": s.qc_2,
                "descr": s.descr,
                "user_id": s.user_id,
                "timestamp": s.timestamp.isoformat() if s.timestamp else None,
            }
        )
    return {"ok": True, "data": result}
