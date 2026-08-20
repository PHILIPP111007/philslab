import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from app.enums import WebSocketGroup
from app.models import User


class TableEditorConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.username = self.scope["url_route"]["kwargs"]["username"]
        self.user = await self._get_user(self.username)

        if not self.user:
            await self.close()
            return

        self.group_name = WebSocketGroup.TABLE_EDITOR_GROUP.value
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Проверяем, был ли определён group_name
        if hasattr(self, "group_name") and self.group_name:
            # При отключении отправляем сообщение об освобождении
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "table_status",
                    "table_name": "samples",
                    "editor": None,
                },
            )
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        table_name = data.get("table_name")
        action = data.get("action", "lock")

        if action == "release":
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "table_status",
                    "table_name": table_name,
                    "editor": None,
                },
            )
        else:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "table_status",
                    "table_name": table_name,
                    "editor": {
                        "id": self.user.id,
                        "username": self.user.username,
                    },
                },
            )

    async def table_status(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "table_name": event["table_name"],
                    "editor": event.get("editor"),
                }
            )
        )

    @database_sync_to_async
    def _get_user(self, username: str):
        return User.objects.filter(username=username).first()
