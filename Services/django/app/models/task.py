from django.db import models
from django.utils import timezone


class Task(models.Model):
    """Модель задачи"""

    class Priority(models.TextChoices):
        CRITICAL = "critical", "Критический"
        HIGH = "high", "Высокий"
        MEDIUM = "medium", "Средний"
        LOW = "low", "Низкий"

    # Основные поля
    name = models.CharField(max_length=255, verbose_name="Название задачи")
    description = models.TextField(verbose_name="Описание")
    department = models.CharField(max_length=150, blank=True, verbose_name="Отдел")

    # Связи с пользователями
    created_by = models.ForeignKey(
        "app.User",
        on_delete=models.CASCADE,
        related_name="created_tasks",
        verbose_name="Создал",
    )
    assigned_to = models.ForeignKey(
        "app.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
        verbose_name="Исполнитель",
    )

    # Даты
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    deadline = models.DateTimeField(verbose_name="Срок выполнения")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    completed_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Дата выполнения"
    )

    # Приоритет и статус
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        verbose_name="Приоритет",
    )
    is_completed = models.BooleanField(default=False, verbose_name="Выполнена")
    is_archived = models.BooleanField(default=False, verbose_name="В архиве")

    # Связи с другими моделями
    protocol = models.ForeignKey(
        "app.Protocol",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
        verbose_name="Протокол/СОП",
    )
    # Этапы задачи – теперь отдельная модель TaskStage, связанная через related_name='stages'
    # Само поле stages не объявляем, но доступно через related_name
    samples = models.ManyToManyField(
        "app.Sample",
        blank=True,
        related_name="tasks",
        verbose_name="Образцы",
    )

    def __str__(self):
        return self.name

    def get_progress(self):
        """Прогресс выполнения — считаем по этапам задачи (TaskStage)"""
        stages = self.stages.all()  # related_name='stages' в TaskStage
        total = stages.count()
        if total == 0:
            return 0
        completed = stages.filter(is_completed=True).count()
        return int((completed / total) * 100)

    def is_overdue(self):
        if self.is_completed:
            return False
        return timezone.now() > self.deadline

    def save(self, *args, **kwargs):
        if self.is_completed and not self.completed_at:
            self.completed_at = timezone.now()
        super().save(*args, **kwargs)
