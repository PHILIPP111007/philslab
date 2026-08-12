from enum import Enum


class Priority(str, Enum):
    """Приоритет задачи"""

    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"
