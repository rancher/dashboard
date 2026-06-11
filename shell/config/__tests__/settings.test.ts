import { SETTING, AUTHENTICATION_SETTINGS, ALLOWED_SETTINGS } from '@shell/config/settings';

describe('AUTHENTICATION_SETTINGS', () => {
  it('includes DISABLE_LOCAL_AUTH', () => {
    expect(AUTHENTICATION_SETTINGS).toContain(SETTING.DISABLE_LOCAL_AUTH);
  });

  it('includes password-min-length', () => {
    expect(AUTHENTICATION_SETTINGS).toContain(SETTING.PASSWORD_MIN_LENGTH);
  });

  it('includes auth-user-session-idle-ttl-minutes', () => {
    expect(AUTHENTICATION_SETTINGS).toContain(SETTING.AUTH_USER_SESSION_IDLE_TTL_MINUTES);
  });

  it('includes auth-user-session-ttl-minutes', () => {
    expect(AUTHENTICATION_SETTINGS).toContain(SETTING.AUTH_USER_SESSION_TTL_MINUTES);
  });

  it('includes auth-token-max-ttl-minutes', () => {
    expect(AUTHENTICATION_SETTINGS).toContain(SETTING.AUTH_TOKEN_MAX_TTL_MINUTES);
  });

  it('includes auth-user-info-resync-cron', () => {
    expect(AUTHENTICATION_SETTINGS).toContain(SETTING.AUTH_USER_INFO_RESYNC_CRON);
  });
});

describe('ALLOWED_SETTINGS', () => {
  it('registers disable-local-auth as a boolean kind', () => {
    expect(ALLOWED_SETTINGS[SETTING.DISABLE_LOCAL_AUTH]).toStrictEqual({ kind: 'boolean' });
  });
});
