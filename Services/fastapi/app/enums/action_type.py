from enum import Enum


class ActionType(str, Enum):
    """Тип действия в истории"""

    CREATED = "created"
    DELETED = "deleted"
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
