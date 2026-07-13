import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api';

const checkInErrors = new Counter('check_in_errors');
const checkOutErrors = new Counter('check_out_errors');
const successRate = new Rate('success_rate');
const checkInLatency = new Trend('check_in_latency', true);

export const options = {
  stages: [
    { duration: '20s', target: 25 },
    { duration: '1m', target: 50 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    'check_in_latency': ['p(95)<800', 'p(99)<1500'],
    success_rate: ['rate>0.90'],
  },
};

export function setup() {
  return { token: __ENV.FIREBASE_ID_TOKEN || '' };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  const employeeId = (__ITER % 5) + 1;

  // Simulate check-in
  const checkInRes = http.post(
    `${BASE_URL}/attendance/check-in`,
    JSON.stringify({
      employee_id: employeeId,
      lat: 24.7136 + (Math.random() - 0.5) * 0.01,
      lng: 46.6753 + (Math.random() - 0.5) * 0.01,
      geofence_id: 1,
    }),
    { headers }
  );

  checkInLatency.add(checkInRes.timings.duration);

  const ok = check(checkInRes, {
    'check-in status 200 or 409': (r) => r.status === 200 || r.status === 201 || r.status === 409,
  });
  successRate.add(ok);
  if (!ok) checkInErrors.add(1);

  sleep(2);

  // Simulate check-out
  const checkOutRes = http.post(
    `${BASE_URL}/attendance/check-out`,
    JSON.stringify({ employee_id: employeeId }),
    { headers }
  );

  const outOk = check(checkOutRes, {
    'check-out status 200 or 409': (r) => r.status === 200 || r.status === 409,
  });
  successRate.add(outOk);
  if (!outOk) checkOutErrors.add(1);

  sleep(1);
}
