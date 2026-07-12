from django.contrib.auth.models import User
from django.db import models


class Sample(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL)
    timestamp = models.DateTimeField(auto_now_add=True)
    content = models.TextField(max_length=5000)
    changed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user} [ {self.timestamp} ]"
