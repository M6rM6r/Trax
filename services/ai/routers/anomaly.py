"""Anomaly detection router — detects unusual employee behavior patterns."""

from fastapi import APIRouter, Request
from schemas.schemas import AnomalyInput, AnomalyOutput
import numpy as np

router = APIRouter()


@router.post("/detect", response_model=AnomalyOutput)
async def detect_anomaly(input_data: AnomalyInput, request: Request):
    model = request.app.state.models.anomaly_detector
    features = np.array([[
        input_data.check_in_hour,
        input_data.check_out_hour,
        input_data.worked_hours,
        input_data.late_frequency,
    ]])

    prediction = int(model.predict(features)[0])
    score = float(model.score_samples(features)[0])

    is_anomaly = prediction == -1

    details = "Normal behavior pattern detected."
    if is_anomaly:
        if input_data.check_in_hour > 10:
            details = "Unusually late check-in detected."
        elif input_data.worked_hours < 4:
            details = "Unusually short work duration detected."
        elif input_data.late_frequency > 0.5:
            details = "High late frequency anomaly detected."
        else:
            details = "Irregular behavior pattern detected."

    return AnomalyOutput(
        employee_id=input_data.employee_id,
        is_anomaly=is_anomaly,
        anomaly_score=round(abs(score), 4),
        details=details,
    )


@router.get("/threshold")
async def get_threshold():
    return {
        "anomaly_threshold": 2.5,
        "contamination_rate": 0.1,
        "description": "Employees with anomaly_score above threshold should be reviewed.",
    }
