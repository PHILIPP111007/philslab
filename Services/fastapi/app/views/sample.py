from fastapi import APIRouter, Query, Request
from sqlalchemy.orm import selectinload
from sqlmodel import func, select

from app.database import SessionDep
from app.models import Batch, Sample
from app.request_body.sample import SampleCreate, SampleUpdate

router = APIRouter(tags=["sample"])


def serialize_sample(sample: Sample) -> dict:
    """Сериализует объект Sample в словарь с ISO-датами и связанными данными."""
    return {
        "id": sample.id,
        "sample_code": sample.sample_code,
        "sample_group_code": sample.sample_group_code,
        "zlims_code": sample.zlims_code,
        "uin1": sample.uin1,
        "uin2": sample.uin2,
        "project_code": sample.project_code,
        "sample_index": sample.sample_index,
        "qc_1": sample.qc_1,
        "qc_2": sample.qc_2,
        "descr": sample.descr,
        "material_type": sample.material_type,
        "timestamp": sample.timestamp.isoformat() if sample.timestamp else None,
        "updated_at": sample.updated_at.isoformat() if sample.updated_at else None,
        "user_id": sample.user_id,
        "user": {
            "id": sample.user.id,
            "username": sample.user.username,
            "first_name": sample.user.first_name,
            "last_name": sample.user.last_name,
        }
        if sample.user
        else None,
        "batches": [
            {
                "id": batch.id,
                "name": batch.name,
                "department": batch.department,
                "timestamp": batch.timestamp.isoformat() if batch.timestamp else None,
                # sample_count вычисляется, если загружены связанные образцы
                "sample_count": len(batch.samples) if hasattr(batch, "samples") else 0,
            }
            for batch in (sample.batches or [])
        ],
    }


@router.get("/sample/{sample_id}/")
async def get_sample(session: SessionDep, request: Request, sample_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    sample = await session.get(
        Sample,
        sample_id,
        options=[
            selectinload(Sample.user),
            selectinload(Sample.batches).selectinload(
                Batch.samples
            ),  # ← вложенная загрузка
        ],
    )
    if not sample:
        return {"ok": False, "error": "Sample not found."}

    return {"ok": True, "data": serialize_sample(sample)}


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
        search_cond = Sample.zlims_code.contains(search) | Sample.descr.contains(search)
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

    data = (await session.exec(statement)).all()
    return {
        "ok": True,
        "data": data,
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
async def create_sample(
    session: SessionDep,
    request: Request,
    sample_data: SampleCreate,
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    sample = Sample(
        sample_code=sample_data.sample_code,
        sample_group_code=sample_data.sample_group_code,
        zlims_code=sample_data.zlims_code,
        uin1=sample_data.uin1,
        uin2=sample_data.uin2,
        project_code=sample_data.project_code,
        sample_index=sample_data.sample_index,
        qc_1=sample_data.qc_1,
        qc_2=sample_data.qc_2,
        descr=sample_data.descr,
        material_type=sample_data.material_type,
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


@router.get("/samples/export/")
async def export_samples(
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

    statement = select(Sample)

    # Глобальный поиск
    if search:
        statement = statement.where(
            (Sample.sample_code.contains(search)) | (Sample.descr.contains(search))
            # Можно добавить другие поля при необходимости
        )

    # Применяем фильтры по полям
    for field, value in filters.items():
        if not hasattr(Sample, field):
            continue
        column = getattr(Sample, field)
        # Для числовых полей – точное совпадение
        if field in ("qc_1", "qc_2", "sample_id", "user_id"):
            try:
                if "." in value:
                    num_val = float(value)
                else:
                    num_val = int(value)
                statement = statement.where(column == num_val)
            except ValueError:
                pass
        else:
            # Для текстовых полей – поиск подстроки (регистронезависимый)
            statement = statement.where(column.ilike(f"%{value}%"))

    # Сортировка
    sort_by = request.query_params.get("sort_by")
    sort_order = request.query_params.get("sort_order", "asc")
    if sort_by and hasattr(Sample, sort_by):
        column = getattr(Sample, sort_by)
        statement = statement.order_by(
            column.desc() if sort_order == "desc" else column.asc()
        )
    else:
        statement = statement.order_by(Sample.timestamp.desc())

    samples = (await session.exec(statement)).all()

    # Формируем полный список полей, соответствующий основному эндпоинту samples
    result = []
    for s in samples:
        result.append(
            {
                "id": s.id,
                "sample_code": s.sample_code,
                "sample_group_code": s.sample_group_code,
                "zlims_code": s.zlims_code,
                "uin1": s.uin1,
                "uin2": s.uin2,
                "project_code": s.project_code,
                "sample_index": s.sample_index,
                "qc_1": s.qc_1,
                "qc_2": s.qc_2,
                "descr": s.descr,
                "material_type": s.material_type,
                "user_id": s.user_id,
                "timestamp": s.timestamp.isoformat() if s.timestamp else None,
            }
        )
    return {"ok": True, "data": result}
