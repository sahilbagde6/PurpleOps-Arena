from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import init_db
from app.api.v1 import auth, scenarios, attacks, detections, incidents, ai, reports, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="PurpleOps Arena API",
    description="AI-powered purple team cyber range platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Fix 2: register runs_router at /api/v1/runs to avoid path collision
app.include_router(auth.router,              prefix="/api/v1/auth",       tags=["auth"])
app.include_router(scenarios.router,         prefix="/api/v1/scenarios",  tags=["scenarios"])
app.include_router(scenarios.runs_router,    prefix="/api/v1/runs",       tags=["runs"])
# Fix 8: attacks telemetry routes live at /api/v1/attacks, events at same prefix
app.include_router(attacks.router,           prefix="/api/v1/attacks",    tags=["attacks"])
app.include_router(detections.router,        prefix="/api/v1/detections", tags=["detections"])
app.include_router(incidents.router,         prefix="/api/v1/incidents",  tags=["incidents"])
app.include_router(ai.router,                prefix="/api/v1/ai",         tags=["ai"])
app.include_router(reports.router,           prefix="/api/v1/reports",    tags=["reports"])
app.include_router(ws.router,                prefix="/ws",                 tags=["websocket"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "PurpleOps Arena"}
