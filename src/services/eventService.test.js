import { getEvents, getEventById, createEvent, inscribirEvent } from './eventService';
import { get, post } from './apiClient';

jest.mock('./apiClient', () => ({ get: jest.fn(), post: jest.fn() }));

const ok = (data) => ({ ok: true, json: jest.fn().mockResolvedValue(data) });
const fail = (status, data = {}) => ({
  ok: false,
  status,
  json: jest.fn().mockResolvedValue(data),
});

beforeEach(() => jest.clearAllMocks());

describe('getEvents', () => {
  test('returns json on ok', async () => {
    get.mockResolvedValue(ok([{ id: 'e1' }]));
    expect(await getEvents()).toEqual([{ id: 'e1' }]);
  });

  test('throws on error', async () => {
    get.mockResolvedValue(fail(500));
    await expect(getEvents()).rejects.toThrow('Error 500');
  });
});

describe('getEventById', () => {
  test('returns json on ok', async () => {
    get.mockResolvedValue(ok({ id: 'e1', name: 'Test' }));
    expect(await getEventById('e1')).toEqual({ id: 'e1', name: 'Test' });
  });

  test('throws on not found', async () => {
    get.mockResolvedValue(fail(404));
    await expect(getEventById('e1')).rejects.toThrow('Evento no encontrado');
  });
});

describe('createEvent', () => {
  test('returns json on ok', async () => {
    post.mockResolvedValue(ok({ id: 'e2' }));
    expect(await createEvent({ name: 'New' })).toEqual({ id: 'e2' });
  });

  test('throws error message from body', async () => {
    post.mockResolvedValue(fail(400, { error: 'Bad data' }));
    await expect(createEvent({})).rejects.toThrow('Bad data');
  });

  test('throws status error when no body error', async () => {
    post.mockResolvedValue(fail(500, {}));
    await expect(createEvent({})).rejects.toThrow('Error 500');
  });
});

describe('inscribirEvent', () => {
  test('returns json on ok', async () => {
    post.mockResolvedValue(ok({ inscrito: true }));
    expect(await inscribirEvent('e1', 'u1')).toEqual({ inscrito: true });
  });

  test('throws on error', async () => {
    post.mockResolvedValue(fail(409, { error: 'Ya inscrito' }));
    await expect(inscribirEvent('e1', 'u1')).rejects.toThrow('Ya inscrito');
  });
});
