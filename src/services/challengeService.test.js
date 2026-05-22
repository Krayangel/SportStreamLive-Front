import {
  getChallenges, getChallengeById, createChallenge,
  unirseChallenge, salirChallenge, registrarProgreso,
  getProgreso, addEvidencia, getEvidencias,
} from './challengeService';
import { get, post, apiRequest } from './apiClient';

jest.mock('./apiClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
  apiRequest: jest.fn(),
}));

const ok = (data) => ({ ok: true, json: jest.fn().mockResolvedValue(data) });
const fail = (status, data = {}) => ({
  ok: false,
  status,
  json: jest.fn().mockResolvedValue(data),
});

beforeEach(() => jest.clearAllMocks());

describe('getChallenges', () => {
  test('returns list on ok', async () => {
    get.mockResolvedValue(ok([{ id: 'c1' }]));
    expect(await getChallenges()).toEqual([{ id: 'c1' }]);
  });
  test('throws on error', async () => {
    get.mockResolvedValue(fail(500));
    await expect(getChallenges()).rejects.toThrow('Error 500');
  });
});

describe('getChallengeById', () => {
  test('returns challenge on ok', async () => {
    get.mockResolvedValue(ok({ id: 'c1', name: 'Test' }));
    expect(await getChallengeById('c1')).toEqual({ id: 'c1', name: 'Test' });
  });
  test('throws on not found', async () => {
    get.mockResolvedValue(fail(404));
    await expect(getChallengeById('c1')).rejects.toThrow('Reto no encontrado');
  });
});

describe('createChallenge', () => {
  test('returns new challenge on ok', async () => {
    post.mockResolvedValue(ok({ id: 'c2' }));
    expect(await createChallenge({ name: 'New' })).toEqual({ id: 'c2' });
  });
  test('throws error from body', async () => {
    post.mockResolvedValue(fail(400, { error: 'Bad data' }));
    await expect(createChallenge({})).rejects.toThrow('Bad data');
  });
  test('throws default when no error field', async () => {
    post.mockResolvedValue(fail(500, {}));
    await expect(createChallenge({})).rejects.toThrow('Error al crear el reto');
  });
});

describe('unirseChallenge', () => {
  test('returns result on ok', async () => {
    post.mockResolvedValue(ok({ joined: true }));
    expect(await unirseChallenge('c1', 'u1')).toEqual({ joined: true });
  });
  test('throws on error', async () => {
    post.mockResolvedValue(fail(409, { error: 'Ya unido' }));
    await expect(unirseChallenge('c1', 'u1')).rejects.toThrow('Ya unido');
  });
});

describe('salirChallenge', () => {
  test('returns result on ok', async () => {
    apiRequest.mockResolvedValue(ok({ left: true }));
    expect(await salirChallenge('c1', 'u1')).toEqual({ left: true });
  });
  test('throws on error', async () => {
    apiRequest.mockResolvedValue(fail(400, { error: 'Cannot leave' }));
    await expect(salirChallenge('c1', 'u1')).rejects.toThrow('Cannot leave');
  });
});

describe('registrarProgreso', () => {
  test('returns result on ok', async () => {
    post.mockResolvedValue(ok({ saved: true }));
    expect(await registrarProgreso('c1', 'u1', 'texto')).toEqual({ saved: true });
  });
  test('throws on error', async () => {
    post.mockResolvedValue(fail(500, {}));
    await expect(registrarProgreso('c1', 'u1', 'x')).rejects.toThrow('Error al registrar progreso');
  });
});

describe('getProgreso', () => {
  test('returns data on ok', async () => {
    get.mockResolvedValue(ok({ progreso: 50 }));
    expect(await getProgreso('c1', 'u1')).toEqual({ progreso: 50 });
  });
  test('returns {} on error', async () => {
    get.mockResolvedValue(fail(404));
    expect(await getProgreso('c1', 'u1')).toEqual({});
  });
});

describe('addEvidencia', () => {
  test('returns result on ok', async () => {
    post.mockResolvedValue(ok({ id: 'ev1' }));
    expect(await addEvidencia('c1', 'u1', 'texto')).toEqual({ id: 'ev1' });
  });
  test('throws on error', async () => {
    post.mockResolvedValue(fail(400, { error: 'Invalid' }));
    await expect(addEvidencia('c1', 'u1', 'x')).rejects.toThrow('Invalid');
  });
});

describe('getEvidencias', () => {
  test('returns list on ok', async () => {
    get.mockResolvedValue(ok([{ id: 'ev1' }]));
    expect(await getEvidencias('c1', 'u1')).toEqual([{ id: 'ev1' }]);
  });
  test('returns [] on error', async () => {
    get.mockResolvedValue(fail(404));
    expect(await getEvidencias('c1', 'u1')).toEqual([]);
  });
});
