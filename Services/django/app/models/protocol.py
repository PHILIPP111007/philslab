from django.db import models


class Protocol(models.Model):
    """Протокол/СОП"""

    name = models.CharField(max_length=255, verbose_name="Название")
    code = models.CharField(max_length=50, unique=True, verbose_name="Код (СОП-001)")
    description = models.TextField(blank=True, verbose_name="Описание")
    version = models.CharField(max_length=20, default="1.0", verbose_name="Версия")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    created_by = models.ForeignKey(
        "app.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_protocols",
        verbose_name="Создал",
    )

    def __str__(self):
        return self.name
