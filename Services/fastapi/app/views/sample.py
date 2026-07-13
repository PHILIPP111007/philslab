from fastapi import APIRouter, Request
from sqlmodel import select

from app.database import SessionDep
from app.models import Sample
from app.request_body.sample import SampleCreate, SampleUpdate

router = APIRouter(tags=["sample"])


@router.get("/samples/")
async def get_samples(session: SessionDep, request: Request):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    query = await session.exec(select(Sample))
    samples = query.all()
    if not samples:
        return {"ok": False, "error": "Not found sample."}

    return {"ok": True, "data": samples}


@router.get("/sample/{sample_id}/")
async def get_sample(session: SessionDep, request: Request, sample_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    query = await session.exec(select(Sample).where(Sample.id == sample_id))
    sample = query.first()
    if not sample:
        return {"ok": False, "error": "Not found sample."}

    return {"ok": True, "data": sample}


@router.post("/sample/")
async def post_sample(session: SessionDep, request: Request, sample_data: SampleCreate):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    sample = Sample(
        zlims_id=sample_data.zlims_id,
        some_number=sample_data.some_number,
        descr=sample_data.descr,
        user_id=request.state.user.id,
    )

    session.add(sample)
    await session.commit()
    await session.refresh(sample)

    return {"ok": True, "data": sample}


@router.put("/sample/{sample_id}/")
async def put_sample(
    session: SessionDep, request: Request, sample_id: int, sample_data: SampleUpdate
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    query = await session.exec(select(Sample).where(Sample.id == sample_id))
    sample = query.first()
    if not sample:
        return {"ok": False, "error": "Not found sample."}

    # Обновляем только переданные поля
    if sample_data.zlims_id is not None:
        sample.zlims_id = sample_data.zlims_id
    if sample_data.some_number is not None:
        sample.some_number = sample_data.some_number
    if sample_data.descr is not None:
        sample.descr = sample_data.descr

    session.add(sample)
    await session.commit()
    await session.refresh(sample)
    return {"ok": True, "data": sample}


@router.delete("/sample/{sample_id}/")
async def delete_sample(session: SessionDep, request: Request, sample_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    query = await session.exec(select(Sample).where(Sample.id == sample_id))
    sample = query.first()
    if not sample:
        return {"ok": False, "error": "Not found sample."}

    await session.delete(sample)
    await session.commit()
    return {"ok": True}
