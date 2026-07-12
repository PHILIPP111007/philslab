from django.db import models


class Sample(models.Model):
    user = models.ForeignKey(
        "app.User", on_delete=models.SET_NULL, blank=True, null=True
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    content = models.TextField(max_length=5000, default=None, blank=True, null=True)

    def __str__(self):
        return f"{self.user} [ {self.timestamp} ]"
