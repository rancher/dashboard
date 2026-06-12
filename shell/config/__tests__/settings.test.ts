import { SETTING, AUTHENTICATION_SETTINGS } from '@shell/config/settings';

describe('AUTHENTICATION_SETTINGS', () => {
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
