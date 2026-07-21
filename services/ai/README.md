# Trax AI Service (Python/FastAPI)

Retention intelligence microservice for Trax.

## Endpoints

- `GET /health` - service health
- `POST /api/v1/retention/analyze` - retention scoring and action recommendations

## Run locally

```bash
cd services/ai
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Tests

```bash
cd services/ai
pytest
```
