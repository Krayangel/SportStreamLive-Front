import { get, post, put, del } from './apiClient';
import { TOKEN_KEY } from '../config';

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn();
  // Evitar que el 401 recargue la página en tests
  delete window.location;
  window.location = { reload: jest.fn() };
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('apiClient — cabeceras', () => {
  test('GET incluye Authorization cuando hay token', async () => {
    localStorage.setItem(TOKEN_KEY, 'test-jwt');
    global.fetch.mockResolvedValue({ status: 200, ok: true });

    await get('http://localhost/api/test');

    const [, options] = fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer test-jwt');
  });

  test('GET no incluye Authorization cuando no hay token', async () => {
    global.fetch.mockResolvedValue({ status: 200, ok: true });

    await get('http://localhost/api/test');

    const [, options] = fetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  test('POST incluye Content-Type: application/json', async () => {
    global.fetch.mockResolvedValue({ status: 200, ok: true });

    await post('http://localhost/api/test', { key: 'value' });

    const [, options] = fetch.mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.body).toBe('{"key":"value"}');
  });
});

describe('apiClient — métodos HTTP', () => {
  test('get usa método GET', async () => {
    global.fetch.mockResolvedValue({ status: 200, ok: true });
    await get('http://localhost/api/x');
    expect(fetch.mock.calls[0][1].method).toBe('GET');
  });

  test('post usa método POST', async () => {
    global.fetch.mockResolvedValue({ status: 200, ok: true });
    await post('http://localhost/api/x', {});
    expect(fetch.mock.calls[0][1].method).toBe('POST');
  });

  test('put usa método PUT', async () => {
    global.fetch.mockResolvedValue({ status: 200, ok: true });
    await put('http://localhost/api/x', {});
    expect(fetch.mock.calls[0][1].method).toBe('PUT');
  });

  test('del usa método DELETE', async () => {
    global.fetch.mockResolvedValue({ status: 200, ok: true });
    await del('http://localhost/api/x');
    expect(fetch.mock.calls[0][1].method).toBe('DELETE');
  });
});

describe('apiClient — manejo de errores', () => {
  test('lanza error descriptivo cuando no hay conexión', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    await expect(get('http://localhost/api/test')).rejects.toThrow(
      'No se pudo conectar con el servidor'
    );
  });

  test('recarga la página al recibir 401', async () => {
    localStorage.setItem(TOKEN_KEY, 'expired-token');
    global.fetch.mockResolvedValue({ status: 401, ok: false });

    await get('http://localhost/api/test');

    expect(window.location.reload).toHaveBeenCalled();
  });
});
