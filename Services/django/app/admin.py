from app.models import Post, User

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

admin.site.register(User, UserAdmin)


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    exclude = ("content",)
    list_display = ("user", "timestamp")
    list_filter = ("user",)
    ordering = ("-timestamp",)
    search_fields = ("user__username",)
