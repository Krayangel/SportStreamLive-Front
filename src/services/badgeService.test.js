import { getBadges, claimBadge, launchBadge } from './badgeService';
import { get, post } from './apiClient';

jest.mock('./apiClient', () => ({ get: jest.fn(), post: jest.fn() }));

const ok = (data) => ({ ok: true, json: jest.fn().mockResolvedValue(data) });
const fail = (status, data = {}) => ({
  ok: false,
  status,
  json: jest.fn().mockResolvedValue(data),
});

beforeEach(() => jest.clearAllMocks());

describe('getBadges', () => {
  test('returns json on ok', async () => {
    get.mockResolvedValue(ok([{ id: '1' }]));
    const result = await getBadges('u1');
    expect(result).toEqual([{ id: '1' }]);
  });

  test('returns [] on error response', async () => {
    get.mockResolvedValue(fail(500));
    const result = await getBadges('u1');
    expect(result).toEqual([]);
  });
});

describe('claimBadge', () => {
  test('posts and returns json', async () => {
    post.mockResolvedValue(ok({ won: true }));
    const result = await claimBadge('b1', 'u1', 'RETO', 'Badge Name');
    expect(result).toEqual({ won: true });
    expect(post).toHaveBeenCalledTimes(1);
  });
});

describe('launchBadge', () => {
  test('returns json on ok', async () => {
    post.mockResolvedValue(ok({ launched: true }));
    const result = await launchBadge('s1', 'RETO', 'Badge');
    expect(result).toEqual({ launched: true });
  });

  test('throws with message on error', async () => {
    post.mockResolvedValue(fail(400, { message: 'Forbidden' }));
    await expect(launchBadge('s1', 'RETO', 'Badge')).rejects.toThrow('Forbidden');
  });

  test('throws HTTP status when no message', async () => {
    post.mockResolvedValue(fail(500, {}));
    await expect(launchBadge('s1', 'RETO', 'Badge')).rejects.toThrow('HTTP 500');
  });
});
