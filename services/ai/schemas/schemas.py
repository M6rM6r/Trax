"""Pydantic schemas for AI service."""

from pydantic import BaseModel, Field


class AttendancePredictionInput(BaseModel):
    employee_id: int
    day_of_week: int = Field(ge=0, le=6, description="0=Sunday, 6=Saturday")
    historical_late_rate: float = Field(ge=0, le=1)
    historical_absent_rate: float = Field(ge=0, le=1)
    distance_to_geofence: float = Field(ge=0, description="meters")
    weather_score: float = Field(ge=0, le=1, default=0.8)


class AttendancePredictionOutput(BaseModel):
    employee_id: int
    predicted_status: str
    confidence: float
    recommendation: str


class AnomalyInput(BaseModel):
    employee_id: int
    check_in_hour: float = Field(ge=0, le=24)
    check_out_hour: float = Field(ge=0, le=24)
    worked_hours: float = Field(ge=0, le=24)
    late_frequency: float = Field(ge=0, le=1)


class AnomalyOutput(BaseModel):
    employee_id: int
    is_anomaly: bool
    anomaly_score: float
    details: str


class PatternAnalysisInput(BaseModel):
    employee_id: int
    attendance_history: list[dict]


class PatternAnalysisOutput(BaseModel):
    employee_id: int
    avg_check_in_time: str
    avg_check_out_time: str
    avg_worked_hours: float
    on_time_rate: float
    pattern_consistency: float
    insights: list[str]
