from django.conf import settings
from django.conf import settings as django_settings
from djoser import utils
from djoser.conf import settings as djoser_settings
from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.serializers import Serializer

from app.models import User


class TokenCreateView(utils.ActionViewMixin, generics.GenericAPIView):
    serializer_class = djoser_settings.SERIALIZERS.token_create
    permission_classes = djoser_settings.PERMISSIONS.token_create

    def post(self, request, **kwargs):
        # --- rate limit (твой оригинальный код) ---
        ip_address = request.META.get("REMOTE_ADDR", "unknown")
        key = django_settings.TOKEN_CREATE_CACHE_KEY.format(ip_address)
        token_cache = django_settings.cache.get(key, None)
        if token_cache is not None:
            return Response(
                {"ok": False, "error": "Entry limit reached, wait 10 sec"},
                status=status.HTTP_403_FORBIDDEN,
            )
        django_settings.cache.set(key, True, 10)

        # --- DEV MODE: создаём/возвращаем тестового юзера ---
        if settings.DEVELOPMENT == "1":
            test_username = "test_user"
            test_password = "TestPass123!"  # или генерируй случайный
            user, created = User.objects.get_or_create(username=test_username)
            if created:
                user.set_password(test_password)
                user.is_active = True
                user.save()
            # Логиним тестового пользователя и выдаём токен
            token = utils.login_user(self.request, user)
            token_serializer_class = djoser_settings.SERIALIZERS.token
            return Response(
                data=token_serializer_class(token).data,
                status=status.HTTP_200_OK,
            )

        # --- PROD MODE: обычная валидация ---
        return super().post(request, **kwargs)

    def _action(self, serializer):
        # Сюда попадаем только в production
        token = utils.login_user(self.request, serializer.user)
        token_serializer_class = djoser_settings.SERIALIZERS.token
        return Response(
            data=token_serializer_class(token).data,
            status=status.HTTP_200_OK,
        )


class TokenDestroyView(views.APIView):
    """Use this endpoint to logout user (remove user authentication token)."""

    serializer_class = Serializer
    permission_classes = djoser_settings.PERMISSIONS.token_destroy

    def post(self, request):
        utils.logout_user(request)
        return Response(status=status.HTTP_204_NO_CONTENT)
