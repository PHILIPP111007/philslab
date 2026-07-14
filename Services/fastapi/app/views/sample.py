from fastapi import APIRouter, Query, Request
from sqlmodel import func, select

from app.database import SessionDep
from app.models import Sample
from app.request_body.sample import SampleCreate, SampleUpdate

router = APIRouter(tags=["sample"])


@router.get("/samples/")
async def get_samples(
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

    # Извлекаем все параметры запроса, начинающиеся с 'filter['
    filters = {}
    for key, value in request.query_params.items():
        if key.startswith("filter[") and key.endswith("]"):
            field_name = key[len("filter[") : -1]
            filters[field_name] = value

    statement = select(Sample)

    # Применяем фильтры
    for field, value in filters.items():
        if hasattr(Sample, field):
            column = getattr(Sample, field)
            # простой точный фильтр; можно расширить
            statement = statement.where(column == value)

    # Глобальный поиск
    if search:
        search_cond = (
            Sample.zlims_id.contains(search)
            | Sample.some_number.contains(search)
            | Sample.descr.contains(search)
        )
        statement = statement.where(search_cond)

    # Сортировка
    if sort_by and hasattr(Sample, sort_by):
        column = getattr(Sample, sort_by)
        statement = statement.order_by(
            column.desc() if sort_order == "desc" else column.asc()
        )

    # Подсчёт общего количества
    count_stmt = select(func.count()).select_from(statement.subquery())
    total = (await session.exec(count_stmt)).one()

    # Пагинация
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)

    results = (await session.exec(statement)).all()
    return {
        "ok": True,
        "data": results,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


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

    # Мгновенный поиск по первичному ключу
    sample = await session.get(Sample, sample_id)
    if not sample:
        return {"ok": False, "error": "Not found sample."}

    # Применяем только переданные поля
    update_data = sample_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sample, field, value)

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
