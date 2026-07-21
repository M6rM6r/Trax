import os

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_ok() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_retention_analysis_shape() -> None:
    payload = {
        "totalEmployees": 50,
        "activeEmployees": 45,
        "attendanceRate": 82,
        "avgLateMinutes": 7,
        "absenceRate": 12,
        "checkOutCompletionRate": 86,
    }
    response = client.post(
        "/api/v1/retention/analyze",
        json=payload,
        headers={"Authorization": f"Bearer {os.environ['TRAX_AI_API_KEY']}"},
    )
    assert response.status_code == 200

    body = response.json()
    assert body["success"] is True
    assert 0 <= body["data"]["retentionScore"] <= 100
    assert body["data"]["riskLevel"] in {"low", "medium", "high"}
    assert isinstance(body["data"]["recommendedActions"], list)
