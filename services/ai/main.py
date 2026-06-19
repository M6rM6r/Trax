"""
Trax AI Service — FastAPI Microservice
Provides attendance prediction, anomaly detection, and work pattern analysis.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import attendance, anomaly, patterns


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load models into memory
    from models.model_registry import ModelRegistry
    app.state.models = ModelRegistry()
    app.state.models.load_all()
    yield
    # Shutdown: cleanup
    app.state.models.cleanup()


app = FastAPI(
    title="Trax AI Service",
    description="Attendance prediction, anomaly detection, and work pattern analysis",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(attendance.router, prefix="/api/ai/attendance", tags=["attendance"])
app.include_router(anomaly.router, prefix="/api/ai/anomaly", tags=["anomaly"])
app.include_router(patterns.router, prefix="/api/ai/patterns", tags=["patterns"])


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "trax-ai"}
