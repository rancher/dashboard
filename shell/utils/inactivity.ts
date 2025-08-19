import { MANAGEMENT, EXT, NORMAN } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { allHash } from 'utils/promise';

interface userActivityResponse {
  metadata: {
    name: string
  },
  status: {
    expiresAt: string
  }
}

interface parsedInactivitySetting {
  enabled: boolean,
  expiresAt: string | undefined,
  sessionTokenName: string | undefined,
  courtesyTimer: number | undefined,
  courtesyCountdown: number | undefined,
  showModalAfter: number | undefined
}

const defaultParsedTTLData = {
  enabled:           false,
  expiresAt:         undefined,
  sessionTokenName:  undefined,
  courtesyTimer:     undefined,
  courtesyCountdown: undefined,
  showModalAfter:    undefined,
};

export async function checkUserActivityData(store: any, sessionTokenName: string): Promise<userActivityResponse> {
  return await store.dispatch('management/find', { type: EXT.USERACTIVITY, id: sessionTokenName });
}

export async function checkBackendBasedSessionIdle(store: any): Promise<parsedInactivitySetting> {
  let userActivity;
  let sessionTokenName;
  const canListSettings = store.getters[`management/canList`](MANAGEMENT.SETTING);
  const canListUserAct = store.getters[`management/canList`](EXT.USERACTIVITY);
  const canListTokens = store.getters[`rancher/canList`](NORMAN.TOKEN);

  if (canListUserAct && canListTokens && canListSettings) {
    const hash = {
      userSessionTtlIdleSetting: store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.AUTH_USER_SESSION_IDLE_TTL_MINUTES }),
      userSessionTtlSetting:     store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.AUTH_USER_SESSION_TTL_MINUTES }),
      tokens:                    store.dispatch('rancher/findAll', { type: NORMAN.TOKEN }),
    };

    const res = await allHash(hash);

    const userSessionTtlIdleSetting = res.userSessionTtlIdleSetting;
    const userSessionTtlSetting = res.userSessionTtlSetting;
    const tokens = res.tokens;

    const ttlIdleValue = parseInt(userSessionTtlIdleSetting?.value || 0);
    const ttlValue = parseInt(userSessionTtlSetting?.value || 0);

    const sessionToken = tokens.find((token: any) => token.description === 'UI session' && token.current);

    console.error('ttlIdleValue', ttlIdleValue);
    console.error('ttlValue', ttlValue);

    if (sessionToken && ttlIdleValue < ttlValue) {
      sessionTokenName = sessionToken.name;

      try {
        userActivity = await updateUserActivityToken(store, sessionTokenName);

        console.error('DATA userActivity', userActivity);

        const data = parseTTLData(userActivity);

        console.error('DATA parseTTLData', data);

        console.debug(`UI inactivity modal (backend-based) will show after ${ data.showModalAfter || 0 / 60 }(m) and be shown for ${ data.courtesyTimer || 0 / 60 }(m)`); // eslint-disable-line no-console

        return data;
      } catch (e) {
        console.error(`Could not update user activity for token ${ sessionTokenName }`, e); // eslint-disable-line no-console

        return defaultParsedTTLData;
      }
    }
  }

  console.error('Cannot find a userActivity for this session OR this user does not have permissions to list the necessary resources'); // eslint-disable-line no-console

  return defaultParsedTTLData;
}

export async function updateUserActivityToken(store: any, sessionTokenName: string):Promise<userActivityResponse> {
  const updateUserActivity = await store.dispatch('management/create', {
    apiVersion: 'ext.cattle.io/v1',
    kind:       'UserActivity',
    type:       EXT.USERACTIVITY,
    metadata:   { name: sessionTokenName },
    spec:       { tokenId: sessionTokenName }
  });

  try {
    return await updateUserActivity.save();
  } catch (e) {
    console.error(`Could not update user activity for token ${ sessionTokenName }`, e); // eslint-disable-line no-console

    return Promise.reject(e);
  }
}

export function parseTTLData(userActivityData: userActivityResponse): parsedInactivitySetting {
  const currDate = Date.now();
  const endDate = new Date(userActivityData.status?.expiresAt).getTime();
  const thresholdSeconds = Math.floor((endDate - currDate) / 1000);

  // Amount of time the user sees the inactivity warning
  const courtesyTimerVal = Math.floor(thresholdSeconds * 0.1);
  const courtesyTimer = Math.min(courtesyTimerVal, 60 * 5); // Never show the modal more than 5 minutes

  const courtesyCountdown = courtesyTimer;

  // Amount of time before the user sees the inactivity warning
  // Note - time before warning is shown + time warning is shown = settings threshold (total amount of time)
  const showModalAfter = thresholdSeconds - courtesyTimer;

  return {
    enabled:          true,
    expiresAt:        userActivityData.status?.expiresAt,
    sessionTokenName: userActivityData.metadata?.name,
    courtesyTimer,
    courtesyCountdown,
    showModalAfter
  };
}
