# Trax AI Service

FastAPI microservice providing ML-powered attendance prediction, anomaly detection, and work pattern analysis.

## Endpoints

| Method | Path                              | Description                               |
| ------ | --------------------------------- | ----------------------------------------- |
| GET    | `/health`                         | Health check                              |
| POST   | `/api/ai/attendance/predict`      | Predict attendance status for an employee |
| GET    | `/api/ai/attendance/batch/{date}` | Batch prediction for a date               |
| POST   | `/api/ai/anomaly/detect`          | Detect anomalous behavior                 |
| GET    | `/api/ai/anomaly/threshold`       | Get anomaly threshold config              |
| POST   | `/api/ai/patterns/analyze`        | Analyze historical work patterns          |

## Setup

```bash
cd services/ai
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8001
```

## Models

- **IsolationForest** — Anomaly detection for employee behavior patterns
- **RandomForestClassifier** — Attendance status prediction (present/late/absent)

Both models train on synthetic data at startup. Replace with real data pipeline when available.
