import { startStream, stopStream, isStreamActive, getActiveStreams } from './streamService';
import { get, post } from './apiClient';

jest.mock('./apiClient', () => ({ get: jest.fn(), post: jest.fn() }));

const ok = (data) => ({ ok: true, json: jest.fn().mockResolvedValue(data) });
const fail = (status, data = {}) => ({
  ok: false,
  status,
  json: jest.fn().mockResolvedValue(data),
});

beforeEach(() => jest.clearAllMocks());

describe('startStream', () => {
  test('returns json on success', async () => {
    post.mockResolvedValue(ok({ active: true }));
    expect(await startStream('s1', 'u1')).toEqual({ active: true });
  });

  test('returns data when status is ALREADY_ACTIVE', async () => {
    post.mockResolvedValue(fail(409, { status: 'ALREADY_ACTIVE' }));
    expect(await startStream('s1', 'u1')).toEqual({ status: 'ALREADY_ACTIVE' });
  });

  test('throws on other errors', async () => {
    post.mockResolvedValue(fail(500, { message: 'Internal error' }));
    await expect(startStream('s1', 'u1')).rejects.toThrow('Internal error');
  });

  test('throws default message when no body message', async () => {
    post.mockResolvedValue(fail(500, {}));
    await expect(startStream('s1', 'u1')).rejects.toThrow('Error al iniciar stream');
  });
});

describe('stopStream', () => {
  test('returns json on success', async () => {
    post.mockResolvedValue(ok({ stopped: true }));
    expect(await stopStream('s1', 'u1')).toEqual({ stopped: true });
  });

  test('throws on error', async () => {
    post.mockResolvedValue(fail(403, { message: 'Not allowed' }));
    await expect(stopStream('s1', 'u1')).rejects.toThrow('Not allowed');
  });

  test('throws default message', async () => {
    post.mockResolvedValue(fail(500, {}));
    await expect(stopStream('s1', 'u1')).rejects.toThrow('Error al detener stream');
  });
});

describe('isStreamActive', () => {
  test('returns json on ok', async () => {
    get.mockResolvedValue(ok({ active: true }));
    expect(await isStreamActive('s1')).toEqual({ active: true });
  });

  test('returns { active: false } on error', async () => {
    get.mockResolvedValue(fail(404));
    expect(await isStreamActive('s1')).toEqual({ active: false });
  });
});

describe('getActiveStreams', () => {
  test('returns json on ok', async () => {
    get.mockResolvedValue(ok({ streams: [], count: 0 }));
    expect(await getActiveStreams()).toEqual({ streams: [], count: 0 });
  });

  test('returns fallback on error', async () => {
    get.mockResolvedValue(fail(500));
    expect(await getActiveStreams()).toEqual({ streams: [], count: 0 });
  });
});
