FROM python:3.12-slim

WORKDIR /app

COPY services/ai/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY services/ai/ ./

RUN mkdir -p models/saved

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
