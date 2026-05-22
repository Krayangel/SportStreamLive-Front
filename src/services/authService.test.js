import { getStoredUser, getToken, logout } from './authService';
import { TOKEN_KEY, USER_KEY } from '../config';

// Limpiar localStorage antes de cada test
beforeEach(() => {
  localStorage.clear();
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
