import { getChatHistory } from './chatService';
import { get } from './apiClient';

jest.mock('./apiClient', () => ({ get: jest.fn() }));

const ok = (data) => ({ ok: true, json: jest.fn().mockResolvedValue(data) });

beforeEach(() => jest.clearAllMocks());

test('getChatHistory calls get and returns json', async () => {
  const messages = [{ text: 'hi' }];
  get.mockResolvedValue(ok(messages));
  const result = await getChatHistory('room1');
  expect(result).toEqual(messages);
  expect(get).toHaveBeenCalledTimes(1);
});
