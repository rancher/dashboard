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

interface sessionTokenResponse {
  current: boolean,
  name: string
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

let storedUserActivityResponse: userActivityResponse = {
  metadata: { name: '' },
  status:   { expiresAt: '' }
};
let sessionToken: sessionTokenResponse;

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

    // this can be improved once https://github.com/rancher/rancher/issues/51580 is fixed
    // we should not need to store the UI session token globally
    // side-effect here is that if we the "idle-ttl" setting in the UI, we won't get the updated token
    if (!sessionToken) {
      sessionToken = tokens.find((token: any) => token.description === 'UI session' && token.current);
    }

    // we only consider this feature as enabled IF ttlIdleValue < ttlValue (will be saving XHR requests if they are the same value - "normal" TTL will log out user)
    if (sessionToken && ttlIdleValue < ttlValue) {
      sessionTokenName = sessionToken.name;

      try {
        let requiresFreshData = false;

        if (storedUserActivityResponse.status?.expiresAt) {
          const currDate = Date.now();
          const endDate = new Date(storedUserActivityResponse?.status?.expiresAt).getTime();

          if (currDate < endDate) {
            userActivity = storedUserActivityResponse;
          } else {
            requiresFreshData = true;
          }
        } else {
          requiresFreshData = true;
        }

        // this is the POST to the UserActivity, which will reset the expireAt
        if (requiresFreshData) {
          userActivity = await updateUserActivityToken(store, sessionTokenName);
        }

        if (userActivity) {
          const data = parseTTLData(userActivity);

          console.debug(`UI inactivity modal (backend-based) will show after ${ data.showModalAfter || 0 / 60 }(m) and be shown for ${ data.courtesyTimer || 0 / 60 }(m)`); // eslint-disable-line no-console

          return data;
        }

        console.error(`Could not find any user activity for token ${ sessionTokenName }`); // eslint-disable-line no-console

        return defaultParsedTTLData;
      } catch (e) {
        console.error(`Could not update user activity for token ${ sessionTokenName }`, e); // eslint-disable-line no-console

        return defaultParsedTTLData;
      }
    }
  }

  console.error('Cannot find a userActivity for this session OR this user does not have permissions to list the necessary resources'); // eslint-disable-line no-console

  return defaultParsedTTLData;
}

export async function checkUserActivityData(store: any, sessionTokenName: string): Promise<userActivityResponse> {
  try {
    const updatedData = await store.dispatch('management/find', { type: EXT.USERACTIVITY, id: sessionTokenName });

    // update stored data
    storedUserActivityResponse = updatedData;

    return Promise.resolve(updatedData);
  } catch (e) {
    console.error(`Could not GET UserActivity for session token ${ sessionTokenName }`, e); // eslint-disable-line no-console

    return Promise.reject(e);
  }
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
    const savedData = await updateUserActivity.save();

    // update stored data
    storedUserActivityResponse = savedData;

    return Promise.resolve(savedData);
  } catch (e) {
    console.error(`Could not update (POST) UserActivity for session token ${ sessionTokenName }`, e); // eslint-disable-line no-console

    return Promise.reject(e);
  }
}

export function parseTTLData(userActivityData: userActivityResponse): parsedInactivitySetting {
  const currDate = Date.now();
  const endDate = new Date(userActivityData.status?.expiresAt).getTime();

  // let's give this a 3 second buffer so that we can make sure the logout happens by the frontend
  const thresholdSeconds = Math.floor((endDate - currDate) / 1000) - 3;

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
