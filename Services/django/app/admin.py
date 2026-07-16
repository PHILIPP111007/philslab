from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from app.models import Protocol, QueryHistory, Sample, Stage, Task, User
from app.models.sample import Sample
from app.models.user import User

admin.site.register(User, UserAdmin)


# ============================================
# STAGE
# ============================================


@admin.register(Stage)
class StageAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "is_completed",
        "order",
        "tasks_count",
        "created_at",
    )
    list_filter = ("is_completed", "created_at", "protocol")
    search_fields = ("name", "description", "protocol__name", "protocol__code")
    ordering = ("protocol", "order", "created_at")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (
            "Основная информация",
            {"fields": ("name", "description", "is_completed", "protocol")},
        ),
        ("Порядок и даты", {"fields": ("order", "created_at", "updated_at")}),
    )

    def tasks_count(self, obj):
        """Количество задач, в которых используется этот этап"""
        # При новой структуре этапы принадлежат протоколу,
        # а задачи ссылаются на протокол
        # Поэтому считаем задачи через протокол
        if obj.protocol:
            return obj.protocol.tasks.count()
        return 0


# ============================================
# SAMPLE
# ============================================


@admin.register(Sample)
class SampleAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "user",
        "zlims_id",
        "some_number",
        "timestamp",
        "tasks_count",
    )
    list_filter = ("user", "timestamp")
    search_fields = ("name", "zlims_id", "descr", "user__username")
    ordering = ("-timestamp",)
    readonly_fields = ("timestamp",)
    fieldsets = (
        (
            "Основная информация",
            {"fields": ("name", "user", "zlims_id", "some_number")},
        ),
        ("Описание", {"fields": ("descr",)}),
        ("Дата", {"fields": ("timestamp",)}),
    )

    def tasks_count(self, obj):
        """Количество задач, в которых используется образец"""
        return obj.tasks.count()


# ============================================
# PROTOCOL
# ============================================


@admin.register(Protocol)
class ProtocolAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "name",
        "version",
        "created_by",
        "tasks_count",
        "created_at",
    )
    list_filter = ("created_at", "version")
    search_fields = ("code", "name", "description")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Основная информация", {"fields": ("code", "name", "description", "version")}),
        ("Метаданные", {"fields": ("created_by", "created_at", "updated_at")}),
    )

    def tasks_count(self, obj):
        """Количество задач, использующих этот протокол"""
        return obj.tasks.count()


# ============================================
# QUERY HISTORY
# ============================================


@admin.register(QueryHistory)
class QueryHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "field_name",
        "created_at",
    )
    list_filter = ("action_type", "created_at", "user")
    search_fields = ("task__name", "user__username", "comment")
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)


# ============================================
# TASK (основная модель)
# ============================================


class SampleInline(admin.TabularInline):
    """Inline для образцов задачи"""

    model = Task.samples.through
    extra = 1
    verbose_name = "Образец"
    verbose_name_plural = "Образцы"
    fields = ("sample", "sample_name", "sample_user")
    readonly_fields = ("sample_name", "sample_user")

    def sample_name(self, obj):
        """Название образца"""
        return obj.sample.name if obj.sample else "-"

    def sample_user(self, obj):
        """Пользователь образца"""
        return obj.sample.user if obj.sample else "-"


class HistoryInline(admin.TabularInline):
    """Inline для истории задачи"""

    model = QueryHistory
    extra = 0
    verbose_name = "Запись истории"
    verbose_name_plural = "История изменений"
    fields = ("user", "action_type", "field_name", "comment", "created_at")
    readonly_fields = ("user", "action_type", "field_name", "comment", "created_at")
    can_delete = False
    max_num = 20

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "department",  # ✅ Добавлено
        "deadline",
        "is_completed",
        "created_at",
    )
    list_filter = (
        "priority",
        "is_completed",
        "is_archived",
        "created_at",
        "created_by",
        "assigned_to",
        "protocol",
        "department",  # ✅ Добавлено
    )
    search_fields = (
        "name",
        "description",
        "department",  # ✅ Добавлено
        "created_by__username",
        "assigned_to__username",
    )
    readonly_fields = ("created_at", "updated_at", "completed_at")
    ordering = ("-priority", "-created_at")
    inlines = [SampleInline, HistoryInline]
    fieldsets = (
        (
            "Основная информация",
            {
                "fields": ("name", "description", "department")  # ✅ Добавлено
            },
        ),
        ("Пользователи", {"fields": ("created_by", "assigned_to")}),
        ("Даты", {"fields": ("deadline", "created_at", "updated_at", "completed_at")}),
        ("Статус", {"fields": ("priority", "is_completed", "is_archived")}),
        ("Связи", {"fields": ("protocol",)}),
    )
    actions = ["mark_as_completed", "mark_as_incomplete", "archive_tasks"]
