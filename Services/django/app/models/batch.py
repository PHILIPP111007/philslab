from django.db import models


class Batch(models.Model):
    """
    Батч (партия) образцов — группа подобразцов, объединённых по какому-либо признаку.
    """

    user = models.ForeignKey(
        "app.User",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        verbose_name="Ответственный пользователь",
    )
    name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Название батча",
    )
    department = models.CharField(max_length=150, blank=True, verbose_name="Отдел")
    descr = models.TextField(
        max_length=5000,
        blank=True,
        null=True,
        verbose_name="Описание",
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления",
    )

    subsamples = models.ManyToManyField(
        "app.Subsample",
        blank=True,
        related_name="batches",
        verbose_name="Подобразцы",
    )

    # def __str__(self):
    #     return self.name
