"""Tests for the Trax AI service."""

import pytest
from fastapi.testclient import TestClient
from main import app
from models.model_registry import ModelRegistry


@pytest.fixture(scope="module")
def client():
    app.state.models = ModelRegistry()
    app.state.models.load_all()
    with TestClient(app) as c:
        yield c
    app.state.models.cleanup()


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_attendance_prediction(client):
    response = client.post(
        "/api/ai/attendance/predict",
        json={
            "employee_id": 1,
            "day_of_week": 1,
            "historical_late_rate": 0.1,
            "historical_absent_rate": 0.05,
            "distance_to_geofence": 200,
            "weather_score": 0.8,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_status"] in ["present", "late", "absent"]
    assert 0 <= data["confidence"] <= 1
    assert len(data["recommendation"]) > 0


def test_anomaly_detection_normal(client):
    response = client.post(
        "/api/ai/anomaly/detect",
        json={
            "employee_id": 1,
            "check_in_hour": 8.5,
            "check_out_hour": 17.5,
            "worked_hours": 8.0,
            "late_frequency": 0.1,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["is_anomaly"], bool)
    assert data["anomaly_score"] >= 0


def test_anomaly_detection_abnormal(client):
    response = client.post(
        "/api/ai/anomaly/detect",
        json={
            "employee_id": 2,
            "check_in_hour": 12.0,
            "check_out_hour": 13.0,
            "worked_hours": 1.0,
            "late_frequency": 0.8,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["is_anomaly"], bool)


def test_pattern_analysis(client):
    response = client.post(
        "/api/ai/patterns/analyze",
        json={
            "employee_id": 1,
            "attendance_history": [
                {"checkInTime": "08:30", "checkOutTime": "17:00", "workedHours": 8.5, "status": "present"},
                {"checkInTime": "08:45", "checkOutTime": "17:15", "workedHours": 8.5, "status": "present"},
                {"checkInTime": "09:10", "checkOutTime": "17:00", "workedHours": 7.8, "status": "late"},
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["avg_check_in_time"] != "N/A"
    assert data["on_time_rate"] > 0
    assert len(data["insights"]) > 0


def test_pattern_analysis_empty_history(client):
    response = client.post(
        "/api/ai/patterns/analyze",
        json={
            "employee_id": 99,
            "attendance_history": [],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["avg_check_in_time"] == "N/A"
    assert data["avg_worked_hours"] == 0.0


def test_attendance_prediction_validation_error(client):
    response = client.post(
        "/api/ai/attendance/predict",
        json={
            "employee_id": 1,
            "day_of_week": 9,
            "historical_late_rate": 0.1,
            "historical_absent_rate": 0.05,
            "distance_to_geofence": 200,
        },
    )
    assert response.status_code == 422
