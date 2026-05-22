import { getMetrics } from './metricsService';
import { get } from './apiClient';

jest.mock('./apiClient', () => ({ get: jest.fn() }));

const ok = (data) => ({ ok: true, json: jest.fn().mockResolvedValue(data) });
const fail = (status) => ({ ok: false, status, json: jest.fn() });

beforeEach(() => jest.clearAllMocks());

test('getMetrics returns json on success', async () => {
  get.mockResolvedValue(ok({ logins: 5 }));
  expect(await getMetrics()).toEqual({ logins: 5 });
});

test('getMetrics throws on error', async () => {
  get.mockResolvedValue(fail(403));
  await expect(getMetrics()).rejects.toThrow('Error 403');
});
