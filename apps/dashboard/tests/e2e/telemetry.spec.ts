import { test, expect } from '@playwright/test';
import * as crypto from 'crypto';

test.describe('Telemetry Webhook API', () => {
  const TELEMETRY_SECRET_TOKEN = process.env.TELEMETRY_SECRET_TOKEN || 'local-dev-secret';

  test('Scenario D: Valid Payload Validation', async ({ request }) => {
    const response = await request.post('/api/webhooks/telemetry', {
      headers: {
        'x-telemetry-token': TELEMETRY_SECRET_TOKEN,
      },
      data: {
        level: 'info',
        source: 'e2e-test',
        message: 'This is a valid test payload',
        context: { test: true },
      },
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  test('Scenario D: Unauthorized Access', async ({ request }) => {
    const response = await request.post('/api/webhooks/telemetry', {
      headers: {
        'x-telemetry-token': 'wrong-token',
      },
      data: {
        level: 'info',
        message: 'Unauthorized test payload',
      },
    });

    expect(response.status()).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Unauthorized');
  });

  test('Scenario D: Invalid Payload format', async ({ request }) => {
    const response = await request.post('/api/webhooks/telemetry', {
      headers: {
        'x-telemetry-token': TELEMETRY_SECRET_TOKEN,
        'Content-Type': 'application/json',
      },
      // Sending a string that is not valid JSON
      data: 'invalid json {',
    });

    // We expect the server to catch the JSON parse error without crashing
    expect(response.status()).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Invalid payload');
  });
});
