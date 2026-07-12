from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from app.models.sample import Sample
from app.models.user import User

admin.site.register(User, UserAdmin)


@admin.register(Sample)
class PostAdmin(admin.ModelAdmin):
    exclude = ("content",)
    list_display = ("user", "timestamp")
    list_filter = ("user",)
    ordering = ("-timestamp",)
    search_fields = ("user__username",)
