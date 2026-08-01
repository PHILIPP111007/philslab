from django.db import models


class Stage(models.Model):
    """Этап/шаг выполнения задачи (принадлежит протоколу)"""

    name = models.CharField(max_length=255, verbose_name="Название")
    description = models.TextField(blank=True, verbose_name="Описание")
    is_completed = models.BooleanField(default=False, verbose_name="Выполнен")
    order = models.PositiveIntegerField(default=0, verbose_name="Порядок")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    # ✅ Внешний ключ на протокол
    protocol = models.ForeignKey(
        "app.Protocol",
        on_delete=models.CASCADE,
        related_name="stages",
        verbose_name="Протокол",
    )
