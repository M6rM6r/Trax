import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api';
const LOGIN_EMAIL = __ENV.LOGIN_EMAIL || 'boss@trax.com';
const LOGIN_PASSWORD = __ENV.LOGIN_PASSWORD || '12345678';

const errors = new Counter('errors');
const successRate = new Rate('success_rate');

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 50 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    success_rate: ['rate>0.95'],
    errors: ['count<10'],
  },
};

export function setup() {
  // Login to get Firebase ID token (simulated — in real test, use Firebase REST API)
  const loginRes = http.post(
    `${BASE_URL}/auth/firebase`,
    JSON.stringify({ id_token: __ENV.FIREBASE_ID_TOKEN || 'test-token' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status !== 200) {
    console.error(`Login failed: ${loginRes.status} ${loginRes.body}`);
  }

  return { token: loginRes.json('data.token') || '' };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  // Test dashboard stats
  const statsRes = http.get(`${BASE_URL}/dashboard/stats`, { headers });
  const ok = check(statsRes, {
    'stats status 200': (r) => r.status === 200,
    'stats has data': (r) => r.json('data') !== null,
  });
  successRate.add(ok);
  if (!ok) errors.add(1);

  sleep(0.5);

  // Test employees list
  const empRes = http.get(`${BASE_URL}/employees`, { headers });
  const empOk = check(empRes, {
    'employees status 200': (r) => r.status === 200,
  });
  successRate.add(empOk);
  if (!empOk) errors.add(1);

  sleep(0.5);

  // Test attendance list
  const attRes = http.get(`${BASE_URL}/attendance`, { headers });
  const attOk = check(attRes, {
    'attendance status 200': (r) => r.status === 200,
  });
  successRate.add(attOk);
  if (!attOk) errors.add(1);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}
