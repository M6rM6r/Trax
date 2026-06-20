"""Attendance prediction router — predicts if employee will be present, late, or absent."""

from fastapi import APIRouter, Request
from schemas.schemas import AttendancePredictionInput, AttendancePredictionOutput
from cache import cache
from logging_config import logger
import numpy as np

router = APIRouter()

STATUS_MAP = {0: "present", 1: "late", 2: "absent"}
RECOMMENDATIONS = {
    "present": "Employee likely to arrive on time.",
    "late": "Consider sending a reminder notification 30 minutes before shift.",
    "absent": "High absence risk. Consider follow-up communication.",
}


@router.post("/predict", response_model=AttendancePredictionOutput)
async def predict_attendance(input_data: AttendancePredictionInput, request: Request):
    cache_key = f"{input_data.employee_id}_{input_data.day_of_week}"
    cached = cache.get("attendance_predict", cache_key)
    if cached:
        return AttendancePredictionOutput(**cached)

    model = request.app.state.models.attendance_predictor
    features = np.array([[
        input_data.day_of_week,
        input_data.historical_late_rate,
        input_data.historical_absent_rate,
        input_data.distance_to_geofence,
        input_data.weather_score,
    ]])

    prediction = int(model.predict(features)[0])
    probabilities = model.predict_proba(features)[0]
    confidence = float(max(probabilities))

    predicted_status = STATUS_MAP[prediction]
    result = AttendancePredictionOutput(
        employee_id=input_data.employee_id,
        predicted_status=predicted_status,
        confidence=round(confidence, 4),
        recommendation=RECOMMENDATIONS[predicted_status],
    )

    cache.set("attendance_predict", cache_key, result.model_dump())
    logger.info("attendance_predicted", employee_id=input_data.employee_id, status=predicted_status)
    return result


@router.get("/batch/{date}")
async def batch_predict(date: str, request: Request):
    """Batch predict attendance for all employees for a given date."""
    return {
        "date": date,
        "predictions": [],
        "message": "Batch prediction endpoint — connect to employee database for full functionality.",
    }
