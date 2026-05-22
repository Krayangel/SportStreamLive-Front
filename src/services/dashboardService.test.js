import {
  getDashboard, registrarActividad, sumarXp,
  getMetas, addMeta, updateMetas, deleteMeta,
} from './dashboardService';
import { get, post, put, apiRequest } from './apiClient';

jest.mock('./apiClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  apiRequest: jest.fn(),
}));

const ok = (data) => ({ ok: true, json: jest.fn().mockResolvedValue(data) });
const fail = (status, data = {}) => ({
  ok: false,
  status,
  json: jest.fn().mockResolvedValue(data),
});

beforeEach(() => jest.clearAllMocks());

describe('getDashboard', () => {
  test('returns json on ok', async () => {
    get.mockResolvedValue(ok({ xp: 100 }));
    expect(await getDashboard('u1')).toEqual({ xp: 100 });
  });
  test('returns null on error', async () => {
    get.mockResolvedValue(fail(404));
    expect(await getDashboard('u1')).toBeNull();
  });
});

describe('registrarActividad', () => {
  test('returns json on ok', async () => {
    post.mockResolvedValue(ok({ ok: true }));
    expect(await registrarActividad('u1')).toEqual({ ok: true });
  });
  test('returns null on error', async () => {
    post.mockResolvedValue(fail(500));
    expect(await registrarActividad('u1')).toBeNull();
  });
});

describe('sumarXp', () => {
  test('returns json on ok', async () => {
    post.mockResolvedValue(ok({ xp: 150 }));
    expect(await sumarXp('u1', 50)).toEqual({ xp: 150 });
  });
  test('returns null on error', async () => {
    post.mockResolvedValue(fail(403));
    expect(await sumarXp('u1', 50)).toBeNull();
  });
});

describe('getMetas', () => {
  test('returns array directly', async () => {
    get.mockResolvedValue(ok(['meta1', 'meta2']));
    expect(await getMetas('u1')).toEqual(['meta1', 'meta2']);
  });
  test('extracts metas from object', async () => {
    get.mockResolvedValue(ok({ metas: ['m1'] }));
    expect(await getMetas('u1')).toEqual(['m1']);
  });
  test('returns [] on error', async () => {
    get.mockResolvedValue(fail(500));
    expect(await getMetas('u1')).toEqual([]);
  });
});

describe('addMeta', () => {
  test('returns array on success', async () => {
    post.mockResolvedValue(ok(['m1', 'm2']));
    expect(await addMeta('u1', 'nueva')).toEqual(['m1', 'm2']);
  });
  test('extracts metas array from profile object', async () => {
    post.mockResolvedValue(ok({ metas: ['m1'] }));
    expect(await addMeta('u1', 'nueva')).toEqual(['m1']);
  });
  test('throws on error', async () => {
    post.mockResolvedValue(fail(400, { error: 'Invalid' }));
    await expect(addMeta('u1', 'meta')).rejects.toThrow('Invalid');
  });
  test('throws default error when no error field', async () => {
    post.mockResolvedValue(fail(500, {}));
    await expect(addMeta('u1', 'meta')).rejects.toThrow('Error 500');
  });
});

describe('updateMetas', () => {
  test('returns array on success', async () => {
    put.mockResolvedValue(ok(['m1', 'm2']));
    expect(await updateMetas('u1', ['m1', 'm2'])).toEqual(['m1', 'm2']);
  });
  test('extracts metas from object', async () => {
    put.mockResolvedValue(ok({ metas: ['m1'] }));
    expect(await updateMetas('u1', ['m1'])).toEqual(['m1']);
  });
  test('throws on error', async () => {
    put.mockResolvedValue(fail(500));
    await expect(updateMetas('u1', [])).rejects.toThrow('Error 500');
  });
});

describe('deleteMeta', () => {
  test('returns array on success', async () => {
    apiRequest.mockResolvedValue(ok(['m1']));
    expect(await deleteMeta('u1', 0)).toEqual(['m1']);
  });
  test('throws on error', async () => {
    apiRequest.mockResolvedValue(fail(500));
    await expect(deleteMeta('u1', 0)).rejects.toThrow('Error 500');
  });
});
