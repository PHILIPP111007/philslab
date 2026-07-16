from django.db import models


# models.py — QueryHistory
class QueryHistory(models.Model):
    class ActionType(models.TextChoices):
        CREATED = "created", "Создание"
        UPDATED = "updated", "Обновление"
        STATUS_CHANGED = "status_changed", "Изменение статуса"
        PRIORITY_CHANGED = "priority_changed", "Изменение приоритета"
        ASSIGNEE_CHANGED = "assignee_changed", "Изменение исполнителя"
        COMMENT_ADDED = "comment_added", "Добавление комментария"
        STAGE_COMPLETED = "stage_completed", "Выполнение этапа"
        SAMPLE_ADDED = "sample_added", "Добавление образца"
        SAMPLE_REMOVED = "sample_removed", "Удаление образца"
        PROTOCOL_CHANGED = "protocol_changed", "Изменение протокола"
        DEPARTMENT_CHANGED = "department_changed", "Изменение отдела"

    user = models.ForeignKey(
        "app.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="history_entries",
        verbose_name="Пользователь",
    )
    task = models.ForeignKey(
        "app.Task",
        on_delete=models.CASCADE,
        related_name="history",
        verbose_name="Задача",
    )
    action_type = models.CharField(
        max_length=50, choices=ActionType.choices, verbose_name="Тип действия"
    )
    field_name = models.CharField(
        max_length=100, blank=True, verbose_name="Название поля"
    )
    old_value = models.JSONField(null=True, blank=True, verbose_name="Старое значение")
    new_value = models.JSONField(null=True, blank=True, verbose_name="Новое значение")
    comment = models.TextField(blank=True, verbose_name="Комментарий")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата и время")
