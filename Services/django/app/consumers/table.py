import asyncio
import json
import re

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework.authtoken.models import Token

from app.enums import WebSocketGroup


class TableEditorConsumer(AsyncWebsocketConsumer):
    authentication_timeout = 5
    table_name_pattern = re.compile(r"^[a-z][a-z0-9_]{0,62}$")
    # The current deployment uses one worker and an in-memory channel layer.
    # Keep the owner registry in this process and protect transitions with a
    # single asyncio lock so state changes and broadcasts stay ordered.
    _table_locks = {}
    _table_locks_guard = None

    @classmethod
    def _get_table_locks_guard(cls):
        if cls._table_locks_guard is None:
            cls._table_locks_guard = asyncio.Lock()
        return cls._table_locks_guard

    async def connect(self):
        self.username = self.scope["url_route"]["kwargs"]["username"]
        self.user = None
        self.group_name = None
        self.table_name = None
        self.is_authenticated = False
        self._authentication_timeout_task = asyncio.create_task(
            self._close_unauthenticated_connection()
        )

        # Browser WebSocket clients cannot set an Authorization header. Accept
        # the connection first, then require the token in the first message.
        # This keeps the token out of the URL and browser history.
        await self.accept()

    async def _close_unauthenticated_connection(self):
        await asyncio.sleep(self.authentication_timeout)
        if not self.is_authenticated:
            await self.close(code=4401)

    async def _cancel_authentication_timeout(self):
        task = self._authentication_timeout_task
        if task and not task.done() and task is not asyncio.current_task():
            task.cancel()

    @classmethod
    def _is_valid_table_name(cls, table_name):
        return isinstance(table_name, str) and bool(
            cls.table_name_pattern.fullmatch(table_name)
        )

    async def _authenticate(self, token, table_name):
        if not self._is_valid_table_name(table_name):
            await self.close(code=4400)
            return False

        user = await self._get_user_by_token(token)
        if not user or user.username != self.username:
            await self.close(code=4403)
            return False

        self.user = user
        self.table_name = table_name
        self.group_name = WebSocketGroup.TABLE_EDITOR_GROUP.value
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        self.is_authenticated = True
        await self._cancel_authentication_timeout()
        await self.send(
            text_data=json.dumps(
                {
                    "type": "authenticated",
                    "username": self.user.username,
                    "table_name": self.table_name,
                }
            )
        )

        owner = await self._get_lock_owner(self.table_name)
        if owner:
            await self._send_table_status(self.table_name, owner)
        return True

    async def disconnect(self, close_code):
        await self._cancel_authentication_timeout()

        if hasattr(self, "group_name") and self.group_name and self.table_name:
            await self._release_table_lock(self.table_name)
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except (TypeError, json.JSONDecodeError):
            await self.close(code=4400)
            return

        if not isinstance(data, dict):
            await self.close(code=4400)
            return

        if not self.is_authenticated:
            if data.get("type") != "authenticate":
                await self.close(code=4401)
                return

            token = data.get("token")
            if not isinstance(token, str) or not token:
                await self.close(code=4401)
                return

            await self._authenticate(token, data.get("table_name"))
            return

        table_name = data.get("table_name")
        action = data.get("action", "lock")

        if table_name != self.table_name or action not in {"lock", "release"}:
            await self.close(code=4400)
            return

        if action == "release":
            released, owner = await self._release_table_lock(table_name)
            if not released:
                # A non-owner cannot change the lock. Return the authoritative
                # state to that client instead of broadcasting a fake release.
                owner = await self._get_lock_owner(table_name)
                await self._send_table_status(table_name, owner)
        else:
            acquired, owner = await self._acquire_table_lock(table_name)
            if not acquired:
                # A second client can see the owner, but cannot replace it.
                await self._send_table_status(table_name, owner)

    def _editor_payload(self):
        return {"id": self.user.id, "username": self.user.username}

    async def _acquire_table_lock(self, table_name):
        guard = type(self)._get_table_locks_guard()
        async with guard:
            current = type(self)._table_locks.get(table_name)
            if current and current["channel_name"] != self.channel_name:
                return False, dict(current["editor"])

            owner = self._editor_payload()
            type(self)._table_locks[table_name] = {
                "channel_name": self.channel_name,
                "editor": owner,
            }
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "table_status",
                    "table_name": table_name,
                    "editor": owner,
                },
            )
            return True, owner

    async def _release_table_lock(self, table_name):
        guard = type(self)._get_table_locks_guard()
        async with guard:
            current = type(self)._table_locks.get(table_name)
            if not current or current["channel_name"] != self.channel_name:
                return False, dict(current["editor"]) if current else None

            del type(self)._table_locks[table_name]
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "table_status",
                    "table_name": table_name,
                    "editor": None,
                },
            )
            return True, None

    async def _get_lock_owner(self, table_name):
        guard = type(self)._get_table_locks_guard()
        async with guard:
            current = type(self)._table_locks.get(table_name)
            return dict(current["editor"]) if current else None

    async def _send_table_status(self, table_name, editor):
        await self.send(
            text_data=json.dumps(
                {
                    "table_name": table_name,
                    "editor": editor,
                }
            )
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
    def _get_user_by_token(self, token_key: str):
        token = (
            Token.objects.select_related("user")
            .filter(key=token_key, user__is_active=True)
            .first()
        )
        return token.user if token else None
