from django.db import models


class Sample(models.Model):
    """
    Первичный образец, поступивший в лабораторию.
    """

    # Основные идентификаторы
    sample_code = models.CharField(
        max_length=255,
        verbose_name="Sample_ID",
        help_text="Уникальный идентификатор образца (например, 172R, 2256B, 5335BS_1, 5105)",
        null=True,
        blank=True,
    )
    sample_group_code = models.CharField(
        max_length=255,
        verbose_name="Sample_Group_ID",
        help_text="Групповой идентификатор (Sample_ID без индекса). Используется для объединения связанных образцов.",
        null=True,
        blank=True,
    )
    zlims_code = models.CharField(
        max_length=255,
        verbose_name="ZLIMS_ID",
        help_text="12-значный числовой код (например, 000027053350)",
        null=True,
        blank=True,
    )
    uin1 = models.CharField(
        max_length=255,
        verbose_name="УИН1",
        help_text="Уникальный идентификатор человека — источника биоматериала (конфиденциально).",
        null=True,
        blank=True,
    )
    uin2 = models.CharField(
        max_length=255,
        verbose_name="УИН2",
        help_text="Уникальный идентификатор биоматериала при поступлении (штрихкод, QR-код).",
        null=True,
        blank=True,
    )

    # Детали образца
    project_code = models.CharField(
        max_length=50,
        verbose_name="Буквенный код проекта",
        help_text="Сокращённое название проекта (R, B, Tom, BS и т.д.). Для PopGene оставляем пустым.",
        null=True,
        blank=True,
    )
    sample_index = models.CharField(
        max_length=50,
        verbose_name="sample index",
        help_text="Числовой индекс (_1, _2, ...) для повторных выделений или поступлений.",
        null=True,
        blank=True,
    )

    # Связи
    user = models.ForeignKey(
        "app.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Ответственный пользователь",
    )

    # Дополнительные поля
    name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Внутреннее название",
    )
    some_number = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Дополнительный числовой идентификатор",
    )
    qc_1 = models.FloatField(
        blank=True,
        null=True,
        verbose_name="QC параметр 1",
    )
    qc_2 = models.FloatField(
        blank=True,
        null=True,
        verbose_name="QC параметр 2",
    )
    descr = models.TextField(
        max_length=5000,
        blank=True,
        null=True,
        verbose_name="Описание",
    )
    material_type = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name="Тип биоматериала",
        help_text="Например: кровь, ткань, ДНК, РНК, белок, клетки, бактерии, вирусы и т.д.",
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания записи",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления",
    )

    def __str__(self):
        return f"{self.sample_code} [ {self.zlims_code} ]"


class Subsample(models.Model):
    """
    Подобразец (повторное выделение / копия) — относится к конкретному Sample.
    """

    sample = models.ForeignKey(
        "app.Sample",
        on_delete=models.CASCADE,
        related_name="subsamples",
        verbose_name="Родительский образец",
    )

    # Основные идентификаторы
    sample_code = models.CharField(
        max_length=255,
        verbose_name="Sample_ID",
        help_text="Уникальный идентификатор образца (например, 172R, 2256B, 5335BS_1, 5105)",
        null=True,
        blank=True,
    )

    # Связь с пользователем (кто создал подобразец)
    user = models.ForeignKey(
        "app.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Ответственный пользователь",
    )

    # Дополнительные поля (аналогичны Sample)
    name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Внутреннее название",
    )
    some_number = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Дополнительный числовой идентификатор",
    )
    qc_1 = models.FloatField(
        blank=True,
        null=True,
        verbose_name="QC параметр 1",
    )
    qc_2 = models.FloatField(
        blank=True,
        null=True,
        verbose_name="QC параметр 2",
    )
    descr = models.TextField(
        max_length=5000,
        blank=True,
        null=True,
        verbose_name="Описание",
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания записи",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления",
    )

    def __str__(self):
        return f"{self.sample_code} (of {self.sample.sample_code})"
