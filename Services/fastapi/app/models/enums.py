__all__ = ["Priority", "ActionType"]

from enum import Enum


class Priority(str, Enum):
    """Приоритет задачи"""

    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class ActionType(str, Enum):
    """Тип действия в истории"""

    CREATED = "created"
    UPDATED = "updated"
    STATUS_CHANGED = "status_changed"
    PRIORITY_CHANGED = "priority_changed"
    ASSIGNEE_CHANGED = "assignee_changed"
    COMMENT_ADDED = "comment_added"
    STAGE_COMPLETED = "stage_completed"
    SAMPLE_ADDED = "sample_added"
    SAMPLE_REMOVED = "sample_removed"
    PROTOCOL_CHANGED = "protocol_changed"
    DEPARTMENT_CHANGED = "department_changed"
