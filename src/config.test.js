import { TOKEN_KEY, USER_KEY, WS_TOPICS, WS_APP, ENDPOINTS } from './config';

describe('config — constantes', () => {
  test('TOKEN_KEY es una cadena no vacía', () => {
    expect(typeof TOKEN_KEY).toBe('string');
    expect(TOKEN_KEY.length).toBeGreaterThan(0);
  });

  test('USER_KEY es una cadena no vacía', () => {
    expect(typeof USER_KEY).toBe('string');
    expect(USER_KEY.length).toBeGreaterThan(0);
  });
});

describe('WS_TOPICS', () => {
  test('CHAT genera topic con roomId', () => {
    expect(WS_TOPICS.CHAT('room1')).toBe('/topic/chat/room1');
  });

  test('STREAM genera topic con streamId', () => {
    expect(WS_TOPICS.STREAM('stream-abc')).toBe('/topic/stream/stream-abc');
  });

  test('WEBRTC genera topic con streamId', () => {
    expect(WS_TOPICS.WEBRTC('s1')).toBe('/topic/webrtc/s1');
  });

  test('BADGES genera topic con streamId', () => {
    expect(WS_TOPICS.BADGES('s2')).toBe('/topic/badges/s2');
  });
});

describe('WS_APP', () => {
  test('CHAT genera destino con roomId', () => {
    expect(WS_APP.CHAT('room1')).toBe('/app/chat/room1');
  });

  test('STREAM_START genera destino con streamId', () => {
    expect(WS_APP.STREAM_START('s1')).toContain('/app/stream/s1');
  });

  test('STREAM_STOP genera destino con streamId', () => {
    expect(WS_APP.STREAM_STOP('s1')).toContain('/app/stream/s1');
  });
});

describe('ENDPOINTS', () => {
  test('LOGIN es string que contiene /api/auth/login', () => {
    expect(ENDPOINTS.LOGIN).toContain('/api/auth/login');
  });

  test('REGISTER es string que contiene /api/auth/register', () => {
    expect(ENDPOINTS.REGISTER).toContain('/api/auth/register');
  });

  test('DASHBOARD genera URL con userId', () => {
    expect(ENDPOINTS.DASHBOARD('user1')).toContain('user1');
    expect(ENDPOINTS.DASHBOARD('user1')).toContain('/api/dashboard/');
  });

  test('BADGES genera URL con userId', () => {
    expect(ENDPOINTS.BADGES('user1')).toContain('user1');
  });

  test('STREAMS_ALL es string que contiene /api/streaming/active', () => {
    expect(ENDPOINTS.STREAMS_ALL).toContain('/api/streaming/active');
  });
});
