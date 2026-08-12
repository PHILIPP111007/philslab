"""Stable response serializers for the FastAPI API.

Keeping response construction in one place prevents list and detail endpoints
from slowly drifting apart while the SQLModel relationships evolve.
"""

from __future__ import annotations

from typing import Any

from app.models import Batch, Sample, Task, User


def _iso(value: Any) -> str | None:
    return value.isoformat() if value else None


def serialize_user(user: User | None) -> dict[str, Any] | None:
    if not user:
        return None

    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
    }


def serialize_stage(stage: Any) -> dict[str, Any]:
    return {
        "id": stage.id,
        "name": stage.name,
        "description": stage.description,
        "is_completed": stage.is_completed,
        "order": stage.order,
    }


def serialize_sample_summary(sample: Sample) -> dict[str, Any]:
    return {"id": sample.id, "sample_code": sample.sample_code}


def serialize_batch_summary(batch: Batch) -> dict[str, Any]:
    return {
        "id": batch.id,
        "name": batch.name,
        "department": batch.department,
    }


def serialize_sample(sample: Sample) -> dict[str, Any]:
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
        "timestamp": _iso(sample.timestamp),
        "updated_at": _iso(sample.updated_at),
        "user_id": sample.user_id,
        "user": serialize_user(sample.user),
        "batches": [
            {
                "id": batch.id,
                "name": batch.name,
                "department": batch.department,
                "timestamp": _iso(batch.timestamp),
                "sample_count": len(batch.samples or [])
                if hasattr(batch, "samples")
                else 0,
            }
            for batch in (sample.batches or [])
        ],
    }


def serialize_batch(
    batch: Batch,
    samples: list[Sample] | None = None,
    tasks: list[Task] | None = None,
) -> dict[str, Any]:
    batch_samples = samples if samples is not None else []
    batch_tasks = tasks if tasks is not None else []

    return {
        "id": batch.id,
        "name": batch.name,
        "department": batch.department,
        "descr": batch.descr,
        "timestamp": _iso(batch.timestamp),
        "updated_at": _iso(batch.updated_at),
        "user_id": batch.user_id,
        "sample_count": len(batch_samples),
        "samples": [
            {
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
                "timestamp": _iso(sample.timestamp),
            }
            for sample in batch_samples
        ],
        "tasks": [
            {
                "id": task.id,
                "name": task.name,
                "is_completed": task.is_completed,
                "priority": task.priority,
                "department": task.department,
            }
            for task in batch_tasks
        ],
    }


def serialize_task(
    task: Task,
    *,
    include_history: bool = True,
    include_protocol_version: bool = True,
) -> dict[str, Any]:
    """Serialize a task and its already-loaded relationships.

    Samples are derived from task batches because the database model has no
    direct task-to-sample relation.
    """

    task_batches = list(task.batches or [])
    all_samples = [
        sample for batch in task_batches for sample in (batch.samples or [])
    ]
    unique_samples = list({sample.id: sample for sample in all_samples}.values())
    protocol = task.protocol

    protocol_data = None
    if protocol:
        protocol_data = {
            "id": protocol.id,
            "name": protocol.name,
            "code": protocol.code,
            "stages": [
                serialize_stage(stage) for stage in (protocol.stages or [])
            ],
        }
        if include_protocol_version:
            protocol_data["version"] = protocol.version

    result: dict[str, Any] = {
        "id": task.id,
        "name": task.name,
        "description": task.description,
        "department": task.department or "",
        "deadline": _iso(task.deadline),
        "priority": task.priority,
        "is_completed": task.is_completed,
        "is_archived": task.is_archived,
        "created_at": _iso(task.created_at),
        "updated_at": _iso(task.updated_at),
        "completed_at": _iso(task.completed_at),
        "created_by": serialize_user(task.created_by),
        "assigned_to": serialize_user(task.assigned_to),
        "protocol": protocol_data,
        "stages": [serialize_stage(stage) for stage in (task.task_stages or [])],
        "samples": [serialize_sample_summary(sample) for sample in unique_samples],
        "batches": [serialize_batch_summary(batch) for batch in task_batches],
    }

    if include_history:
        result["history"] = [
            {
                "id": history.id,
                "action_type": history.action_type,
                "field_name": history.field_name,
                "old_value": history.old_value,
                "new_value": history.new_value,
                "comment": history.comment,
                "created_at": _iso(history.created_at),
                "user": serialize_user(history.user),
            }
            for history in (task.history or [])
        ]

    return result
