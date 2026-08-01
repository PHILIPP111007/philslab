# models.py
from django.db import models


class TaskStage(models.Model):
    """Этап задачи (копия из протокола)"""

    task = models.ForeignKey(
        "app.Task", on_delete=models.CASCADE, related_name="task_stages"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_completed = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.task.name} - {self.name}"
