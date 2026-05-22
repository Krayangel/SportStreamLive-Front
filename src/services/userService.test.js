import { getEligibility, changeRole } from './userService';
import { TOKEN_KEY, USER_KEY } from '../config';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const ok = (data) => ({
  ok: true,
  json: jest.fn().mockResolvedValue(data),
});
const fail = (data) => ({
  ok: false,
  json: jest.fn().mockResolvedValue(data),
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  localStorage.setItem(TOKEN_KEY, 'test-token');
});

describe('getEligibility', () => {
  test('returns json on ok', async () => {
    mockFetch.mockResolvedValue(ok({ eligible: true }));
    expect(await getEligibility()).toEqual({ eligible: true });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/me/eligibility'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
    );
  });

  test('throws on error', async () => {
    mockFetch.mockResolvedValue(fail({}));
    await expect(getEligibility()).rejects.toThrow('Error al obtener elegibilidad');
  });
});

describe('changeRole', () => {
  test('stores token and returns data on success', async () => {
    localStorage.setItem(USER_KEY, JSON.stringify({ roles: ['ROLE_USER'] }));
    mockFetch.mockResolvedValue(ok({ token: 'new-token', roles: ['ROLE_STREAMING'] }));
    const result = await changeRole('ROLE_STREAMING');
    expect(result.token).toBe('new-token');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('new-token');
    const stored = JSON.parse(localStorage.getItem(USER_KEY));
    expect(stored.roles).toEqual(['ROLE_STREAMING']);
  });

  test('works even without token in response', async () => {
    mockFetch.mockResolvedValue(ok({ roles: ['ROLE_USER'] }));
    const result = await changeRole('ROLE_USER');
    expect(result.roles).toEqual(['ROLE_USER']);
  });

  test('throws error from body on failure', async () => {
    mockFetch.mockResolvedValue(fail({ error: 'Not eligible' }));
    await expect(changeRole('ROLE_STREAMING')).rejects.toThrow('Not eligible');
  });

  test('throws default message when no error field', async () => {
    mockFetch.mockResolvedValue(fail({}));
    await expect(changeRole('ROLE_STREAMING')).rejects.toThrow('Error al cambiar el rol');
  });
});
