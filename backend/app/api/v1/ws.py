from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
import json
import asyncio

router = APIRouter()

# Simple in-memory connection manager
class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, list[WebSocket]] = {}

    async def connect(self, run_id: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(run_id, []).append(ws)

    def disconnect(self, run_id: str, ws: WebSocket):
        if run_id in self.active:
            self.active[run_id].discard(ws) if hasattr(self.active[run_id], 'discard') else None
            try:
                self.active[run_id].remove(ws)
            except ValueError:
                pass

    async def broadcast(self, run_id: str, message: dict):
        if run_id not in self.active:
            return
        dead = []
        for ws in self.active[run_id]:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(run_id, ws)


manager = ConnectionManager()


@router.websocket("/{run_id}")
async def websocket_endpoint(run_id: str, websocket: WebSocket):
    await manager.connect(run_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back ping/pong
            msg = json.loads(data)
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(run_id, websocket)


async def emit_event(run_id: str, event_type: str, payload: dict):
    """Call this from services/tasks to push events to connected clients."""
    await manager.broadcast(run_id, {"type": event_type, "data": payload})
