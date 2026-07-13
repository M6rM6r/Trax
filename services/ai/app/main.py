from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded


API_KEY = os.environ.get("TRAX_AI_API_KEY", "")


class RetentionFeatures(BaseModel):
    totalEmployees: int = Field(ge=0)
    activeEmployees: int = Field(ge=0)
    attendanceRate: float = Field(ge=0, le=100)
    avgLateMinutes: float = Field(ge=0)
    absenceRate: float = Field(ge=0, le=100)
    checkOutCompletionRate: float = Field(ge=0, le=100)


class RetentionInsight(BaseModel):
    retentionScore: int = Field(ge=0, le=100)
    riskLevel: str
    summary: str
    recommendedActions: list[str]
    confidence: float = Field(ge=0, le=1)


security = HTTPBearer(auto_error=False)


def verify_api_key(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> None:
    if not API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service API key is not configured",
        )
    if not credentials or credentials.scheme.lower() != "bearer" or credentials.credentials != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
            headers={"WWW-Authenticate": "Bearer"},
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not API_KEY:
        print("WARNING: TRAX_AI_API_KEY is not set. Retention endpoint is unprotected.")
    yield


app = FastAPI(title="Trax AI Service", version="0.2.0", lifespan=lifespan)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


def _compute_retention_score(features: RetentionFeatures) -> int:
    score = 100.0
    score -= features.absenceRate * 0.55
    score -= max(features.avgLateMinutes - 5, 0) * 0.9
    score -= max(80 - features.attendanceRate, 0) * 0.6
    score -= max(75 - features.checkOutCompletionRate, 0) * 0.4

    if features.totalEmployees > 0:
        active_ratio = (features.activeEmployees / features.totalEmployees) * 100
        score -= max(85 - active_ratio, 0) * 0.25

    return max(0, min(100, round(score)))


def _risk_level(score: int) -> str:
    if score >= 80:
        return "low"
    if score >= 60:
        return "medium"
    return "high"


def _actions(features: RetentionFeatures, score: int) -> list[str]:
    actions: list[str] = []

    if features.absenceRate >= 20:
        actions.append("Create weekly 1:1 follow-ups for high-absence employees.")
    if features.avgLateMinutes >= 10:
        actions.append("Introduce staggered start windows and late-pattern coaching.")
    if features.checkOutCompletionRate < 70:
        actions.append("Enable checkout reminders and manager end-of-day validation.")
    if features.attendanceRate < 75:
        actions.append("Run attendance recovery campaign with department-level targets.")
    if score < 60:
        actions.append("Escalate to HR/business owner with a 30-day retention intervention plan.")

    if not actions:
        actions.append("Maintain current policy and keep weekly trend monitoring.")

    return actions


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "trax-ai"}


@limiter.limit("30/minute")
@app.post("/api/v1/retention/analyze", dependencies=[Depends(verify_api_key)])
async def analyze_retention(
    request: Request,
    features: RetentionFeatures,
) -> dict[str, Any]:
    score = _compute_retention_score(features)
    risk = _risk_level(score)
    actions = _actions(features, score)

    summary = (
        f"Retention score is {score} with {risk} risk. "
        f"Attendance={features.attendanceRate:.1f}%, Absence={features.absenceRate:.1f}%, "
        f"Avg late={features.avgLateMinutes:.1f} min."
    )

    confidence = 0.84 if features.totalEmployees >= 20 else 0.68

    insight = RetentionInsight(
        retentionScore=score,
        riskLevel=risk,
        summary=summary,
        recommendedActions=actions,
        confidence=confidence,
    )

    return {"success": True, "data": insight.model_dump()}
