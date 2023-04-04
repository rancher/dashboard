import AutoLogout from '@/shell/mixins/auto-logout';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

describe('mixins: auto-logout', () => {
  // jest.useFakeTimers();
  // jest.spyOn(global, 'setTimeout');
  it('should return default session timeout time', () => {
    const logoutMinutesSetting = jest.fn(() => null);
    const localThis = { $store: { getters: { 'management/byId': logoutMinutesSetting } } };

    expect(AutoLogout.computed.sessionLogoutMinutes.call(localThis)).toBe(30);
    expect(logoutMinutesSetting.mock.calls[0][0]).toBe(MANAGEMENT.SETTING);
    expect(logoutMinutesSetting.mock.calls[0][1]).toBe(SETTING.UI_SESSION_LOGOUT_MINUTES);
  });

  it('should return a custom session timeout time', () => {
    const logoutMinutesSetting = jest.fn(() => ({ value: '10' }));
    const localThis = { $store: { getters: { 'management/byId': logoutMinutesSetting } } };

    expect(AutoLogout.computed.sessionLogoutMinutes.call(localThis)).toBe('10');
    expect(logoutMinutesSetting.mock.calls[0][0]).toBe(MANAGEMENT.SETTING);
    expect(logoutMinutesSetting.mock.calls[0][1]).toBe(SETTING.UI_SESSION_LOGOUT_MINUTES);
  });

  it('should return a custom session timeout time (milliseconds)', () => {
    const localThis = { sessionLogoutMinutes: '10' };

    expect(AutoLogout.computed.uiSessionTimeout.call(localThis)).toBe(10 * 60 * 1000);
  });
});
