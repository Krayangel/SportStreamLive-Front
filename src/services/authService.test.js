import { getStoredUser, getToken, logout, login, register } from './authService';
import { TOKEN_KEY, USER_KEY } from '../config';

const FAKE_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1MSIsInJvbGVzIjpbIlJPTEVfVVNFUiJdfQ.sig';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('getToken', () => {
  test('retorna null cuando no hay token', () => {
    expect(getToken()).toBeNull();
  });

  test('retorna el token almacenado', () => {
    localStorage.setItem(TOKEN_KEY, 'my-test-token');
    expect(getToken()).toBe('my-test-token');
  });
});

describe('getStoredUser', () => {
  test('retorna null cuando no hay usuario', () => {
    expect(getStoredUser()).toBeNull();
  });

  test('retorna el usuario almacenado', () => {
    const user = { id: '1', username: 'testuser', email: 'test@test.com', roles: ['ROLE_USER'] };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    expect(getStoredUser()).toEqual(user);
  });

  test('retorna null si el JSON está corrupto', () => {
    localStorage.setItem(USER_KEY, 'not-valid-json{{{');
    expect(getStoredUser()).toBeNull();
  });
});

describe('logout', () => {
  test('elimina token y usuario del localStorage', () => {
    localStorage.setItem(TOKEN_KEY, 'some-token');
    localStorage.setItem(USER_KEY, JSON.stringify({ id: '1' }));

    logout();

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  test('no lanza error si localStorage ya está vacío', () => {
    expect(() => logout()).not.toThrow();
  });
});

describe('login', () => {
  test('stores token and user on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ token: FAKE_TOKEN, username: 'ana', userId: 'u1' }),
    });
    await login('ana@test.com', 'pass');
    expect(localStorage.getItem(TOKEN_KEY)).toBe(FAKE_TOKEN);
    const user = JSON.parse(localStorage.getItem(USER_KEY));
    expect(user.email).toBe('ana@test.com');
    expect(user.username).toBe('ana');
  });

  test('throws error from body on failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Credenciales inválidas' }),
    });
    await expect(login('x@x.com', 'wrong')).rejects.toThrow('Credenciales inválidas');
  });

  test('throws default message when no error field', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({}),
    });
    await expect(login('x@x.com', 'wrong')).rejects.toThrow('Error al iniciar sesión');
  });
});

describe('register', () => {
  test('stores token and user on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ token: FAKE_TOKEN, username: 'ana', userId: 'u1' }),
    });
    await register({ username: 'ana', email: 'ana@test.com', password: 'pass', role: 'ROLE_USER' });
    expect(localStorage.getItem(TOKEN_KEY)).toBe(FAKE_TOKEN);
  });

  test('throws on registration failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Email en uso' }),
    });
    await expect(register({ username: 'a', email: 'a@a.com', password: 'p' }))
      .rejects.toThrow('Email en uso');
  });
});
