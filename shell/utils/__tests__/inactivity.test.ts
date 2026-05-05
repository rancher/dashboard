import { Inactivity } from '@shell/utils/inactivity';

describe('inactivity', () => {
  describe('inactivity class', () => {
    let inactivity: Inactivity;

    beforeEach(() => {
      inactivity = new Inactivity();
    });

    describe('getSessionTokenName', () => {
      it('returns undefined by default', () => {
        expect(inactivity.getSessionTokenName()).toBeUndefined();
      });

      it('returns the token name after setSessionTokenName', () => {
        inactivity.setSessionTokenName('my-token');
        expect(inactivity.getSessionTokenName()).toStrictEqual('my-token');
      });
    });

    describe('setSessionTokenName', () => {
      it('sets the session token name', () => {
        inactivity.setSessionTokenName('token-abc');
        expect(inactivity.getSessionTokenName()).toStrictEqual('token-abc');
      });

      it('overwrites a previously set token name', () => {
        inactivity.setSessionTokenName('first');
        inactivity.setSessionTokenName('second');
        expect(inactivity.getSessionTokenName()).toStrictEqual('second');
      });
    });

    describe('getUserActivity', () => {
      it('dispatches management/find with correct parameters', async() => {
        const mockResult = { status: { expiresAt: '2026-01-01T00:00:00Z' } };
        const mockStore = { dispatch: jest.fn().mockResolvedValue(mockResult) };

        const result = await inactivity.getUserActivity(mockStore, 'my-token');

        expect(mockStore.dispatch).toHaveBeenCalledWith('management/find', {
          type: 'ext.cattle.io.useractivity',
          id:   'my-token',
          opt:  {
            force: true, watch: false, logoutOnError: false
          }
        });
        expect(result).toStrictEqual(mockResult);
      });

      it('passes force=false when specified', async() => {
        const mockResult = { status: { expiresAt: '2026-01-01T00:00:00Z' } };
        const mockStore = { dispatch: jest.fn().mockResolvedValue(mockResult) };

        await inactivity.getUserActivity(mockStore, 'my-token', false);

        expect(mockStore.dispatch).toHaveBeenCalledWith('management/find', {
          type: 'ext.cattle.io.useractivity',
          id:   'my-token',
          opt:  {
            force: false, watch: false, logoutOnError: false
          }
        });
      });

      it('dispatches auth/logout with sessionIdle=true on 401 error', async() => {
        const mockStore = {
          dispatch: jest.fn()
            .mockRejectedValueOnce({ _status: 401 })
            .mockResolvedValue('logged out')
        };

        const result = await inactivity.getUserActivity(mockStore, 'my-token');

        expect(mockStore.dispatch).toHaveBeenCalledWith('auth/logout', { sessionIdle: true });
        expect(result).toStrictEqual('logged out');
      });

      it('re-throws non-401 errors', async() => {
        const mockStore = { dispatch: jest.fn().mockRejectedValue({ _status: 500, message: 'Server Error' }) };

        await expect(inactivity.getUserActivity(mockStore, 'my-token')).rejects.toThrow(Error);
      });
    });

    describe('updateUserActivity', () => {
      it('sets spec with tokenId and seenAt and calls save', async() => {
        const mockSaved = { status: { expiresAt: '2026-01-01T00:00:00Z' } };
        const mockResource: any = { save: jest.fn().mockResolvedValue(mockSaved) };

        const result = await inactivity.updateUserActivity(mockResource, 'my-token', '2026-01-01T00:00:00Z');

        expect(mockResource.spec).toStrictEqual({
          tokenId: 'my-token',
          seenAt:  '2026-01-01T00:00:00Z'
        });
        expect(mockResource.save).toHaveBeenCalledWith({ force: true });
        expect(result).toStrictEqual(mockSaved);
      });

      it('omits seenAt from spec when empty string', async() => {
        const mockSaved = { status: { expiresAt: '2026-01-01T00:00:00Z' } };
        const mockResource: any = { save: jest.fn().mockResolvedValue(mockSaved) };

        await inactivity.updateUserActivity(mockResource, 'my-token', '');

        expect(mockResource.spec).toStrictEqual({ tokenId: 'my-token' });
      });

      it('re-throws errors from save', async() => {
        const mockResource: any = { save: jest.fn().mockRejectedValue(new Error('save failed')) };

        await expect(inactivity.updateUserActivity(mockResource, 'my-token', '2026-01-01T00:00:00Z')).rejects.toThrow(Error);
      });
    });

    describe('parseTTLData', () => {
      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('returns expiresAt from userActivityData.status', () => {
        const expiresAt = '2030-01-01T01:00:00.000Z';
        const now = new Date('2030-01-01T00:00:00.000Z').getTime();

        jest.spyOn(Date, 'now').mockReturnValue(now);

        const data: any = {
          status:   { expiresAt },
          metadata: { name: 'token-1' }
        };

        const result = inactivity.parseTTLData(data);

        expect(result.expiresAt).toStrictEqual(expiresAt);
      });

      it('returns sessionTokenName from userActivityData.metadata.name', () => {
        const expiresAt = '2030-01-01T01:00:00.000Z';
        const now = new Date('2030-01-01T00:00:00.000Z').getTime();

        jest.spyOn(Date, 'now').mockReturnValue(now);

        const data: any = {
          status:   { expiresAt },
          metadata: { name: 'token-abc' }
        };

        const result = inactivity.parseTTLData(data);

        expect(result.sessionTokenName).toStrictEqual('token-abc');
      });

      it('calculates courtesyTimer as 20% of threshold, capped at 300s', () => {
        // 1 hour = 3600 seconds; threshold = 3600 - 3 = 3597s
        // courtesyTimerVal = floor(3597 * 0.2) = floor(719.4) = 719
        // courtesyTimer = min(719, 300) = 300
        const now = new Date('2030-01-01T00:00:00.000Z').getTime();
        const expiresAt = new Date(now + 3600 * 1000).toISOString(); // 1 hour later

        jest.spyOn(Date, 'now').mockReturnValue(now);

        const data: any = {
          status:   { expiresAt },
          metadata: { name: 'token-1' }
        };

        const result = inactivity.parseTTLData(data);

        expect(result.courtesyTimer).toStrictEqual(300);
      });

      it('calculates courtesyTimer as 20% when under 300s cap', () => {
        // 100 seconds until expiry; threshold = 100 - 3 = 97s
        // courtesyTimerVal = floor(97 * 0.2) = floor(19.4) = 19
        // courtesyTimer = min(19, 300) = 19
        const now = new Date('2030-01-01T00:00:00.000Z').getTime();
        const expiresAt = new Date(now + 100 * 1000).toISOString();

        jest.spyOn(Date, 'now').mockReturnValue(now);

        const data: any = {
          status:   { expiresAt },
          metadata: { name: 'token-1' }
        };

        const result = inactivity.parseTTLData(data);

        expect(result.courtesyTimer).toStrictEqual(19);
      });

      it('courtesyCountdown equals courtesyTimer', () => {
        const now = new Date('2030-01-01T00:00:00.000Z').getTime();
        const expiresAt = new Date(now + 100 * 1000).toISOString();

        jest.spyOn(Date, 'now').mockReturnValue(now);

        const data: any = {
          status:   { expiresAt },
          metadata: { name: 'token-1' }
        };

        const result = inactivity.parseTTLData(data);

        expect(result.courtesyCountdown).toStrictEqual(result.courtesyTimer);
      });

      it('calculates showModalAfter = thresholdSeconds - courtesyTimer', () => {
        // 100s; threshold = 97s; courtesyTimer = 19s; showModalAfter = 97 - 19 = 78
        const now = new Date('2030-01-01T00:00:00.000Z').getTime();
        const expiresAt = new Date(now + 100 * 1000).toISOString();

        jest.spyOn(Date, 'now').mockReturnValue(now);

        const data: any = {
          status:   { expiresAt },
          metadata: { name: 'token-1' }
        };

        const result = inactivity.parseTTLData(data);

        expect(result.showModalAfter).toStrictEqual(78);
      });

      it('calculates showModalAfter correctly with large TTL (1 hour)', () => {
        // 3600s; threshold = 3597s; courtesyTimer = 300s (capped); showModalAfter = 3597 - 300 = 3297
        const now = new Date('2030-01-01T00:00:00.000Z').getTime();
        const expiresAt = new Date(now + 3600 * 1000).toISOString();

        jest.spyOn(Date, 'now').mockReturnValue(now);

        const data: any = {
          status:   { expiresAt },
          metadata: { name: 'token-1' }
        };

        const result = inactivity.parseTTLData(data);

        expect(result.showModalAfter).toStrictEqual(3297);
      });

      it('handles expired session (negative thresholdSeconds)', () => {
        // Already expired by 10 seconds; threshold = -10 - 3 = -13s
        // courtesyTimerVal = floor(-13 * 0.2) = floor(-2.6) = -3
        // courtesyTimer = min(-3, 300) = -3
        // showModalAfter = -13 - (-3) = -10
        const now = new Date('2030-01-01T00:00:10.000Z').getTime();
        const expiresAt = new Date('2030-01-01T00:00:00.000Z').toISOString();

        jest.spyOn(Date, 'now').mockReturnValue(now);

        const data: any = {
          status:   { expiresAt },
          metadata: { name: 'token-1' }
        };

        const result = inactivity.parseTTLData(data);

        expect(result.courtesyTimer).toStrictEqual(-3);
        expect(result.showModalAfter).toStrictEqual(-10);
      });

      it('returns undefined for expiresAt when status.expiresAt is absent', () => {
        const now = new Date('2030-01-01T00:00:00.000Z').getTime();

        jest.spyOn(Date, 'now').mockReturnValue(now);

        const data: any = {
          status:   {},
          metadata: { name: 'token-1' }
        };

        const result = inactivity.parseTTLData(data);

        expect(result.expiresAt).toBeUndefined();
      });

      it('returns undefined for sessionTokenName when metadata.name is absent', () => {
        const now = new Date('2030-01-01T00:00:00.000Z').getTime();
        const expiresAt = new Date(now + 100 * 1000).toISOString();

        jest.spyOn(Date, 'now').mockReturnValue(now);

        const data: any = {
          status:   { expiresAt },
          metadata: {}
        };

        const result = inactivity.parseTTLData(data);

        expect(result.sessionTokenName).toBeUndefined();
      });

      it('handles exactly 5 minute threshold (boundary: courtesyTimer not capped)', () => {
        // 300s; threshold = 300 - 3 = 297s
        // courtesyTimerVal = floor(297 * 0.2) = floor(59.4) = 59
        // courtesyTimer = min(59, 300) = 59
        const now = new Date('2030-01-01T00:00:00.000Z').getTime();
        const expiresAt = new Date(now + 300 * 1000).toISOString();

        jest.spyOn(Date, 'now').mockReturnValue(now);

        const data: any = {
          status:   { expiresAt },
          metadata: { name: 'token-1' }
        };

        const result = inactivity.parseTTLData(data);

        expect(result.courtesyTimer).toStrictEqual(59);
        expect(result.showModalAfter).toStrictEqual(238);
      });
    });
  });
});
