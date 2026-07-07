from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel, Field


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


app = FastAPI(title="Trax AI Service", version="0.1.0")


def _compute_retention_score(features: RetentionFeatures) -> int:
    # Deterministic weighted model (easy to audit/operate)
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


@app.post("/api/v1/retention/analyze")
def analyze_retention(features: RetentionFeatures) -> dict[str, object]:
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
