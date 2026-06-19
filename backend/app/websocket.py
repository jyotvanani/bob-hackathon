"""WebSocket connection manager + broadcast helpers.

Used to push real-time events (new traffic events, alerts, transactions,
fraud cases, etc.) to connected admin clients without polling.
"""
import asyncio
import logging
from typing import Any, Dict, List, Optional

from fastapi import WebSocket

log = logging.getLogger("accountguard.ws")


class ConnectionManager:
    def __init__(self) -> None:
        self.active: List[WebSocket] = []
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._lock = asyncio.Lock()

    def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Capture the FastAPI event loop on startup so worker threads can
        schedule broadcasts."""
        self._loop = loop

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self.active.append(ws)

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            if ws in self.active:
                self.active.remove(ws)

    async def broadcast(self, message: Dict[str, Any]) -> None:
        """Broadcast inside the event loop. Drops dead connections silently."""
        async with self._lock:
            connections = list(self.active)

        dead: List[WebSocket] = []
        for ws in connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)

        if dead:
            async with self._lock:
                for ws in dead:
                    if ws in self.active:
                        self.active.remove(ws)

    def broadcast_threadsafe(self, message: Dict[str, Any]) -> None:
        """Schedule a broadcast from a sync context (e.g. background thread).

        Safe to call before the event loop is set; just no-ops in that case.
        """
        if self._loop is None:
            return
        try:
            asyncio.run_coroutine_threadsafe(self.broadcast(message), self._loop)
        except RuntimeError as exc:
            log.warning("broadcast_threadsafe failed: %s", exc)


# Module-level singleton
manager = ConnectionManager()
