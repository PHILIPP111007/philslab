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
    sample_id: int = Query(None, description="Фильтр по родительскому образцу"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    statement = select(Subsample).options(selectinload(Subsample.sample))

    if sample_id:
        statement = statement.where(Subsample.sample_id == sample_id)

    if search:
        statement = statement.where(
            (Subsample.sample_code.contains(search))
            | (Subsample.name.contains(search))
            | (Subsample.descr.contains(search))
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
