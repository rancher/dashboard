import { MANAGEMENT, EXT, NORMAN } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { RancherKubeMetadata } from '@shell/types/kube/kube-api';
import { allHash } from 'utils/promise';

interface UserActivityResponse {
  metadata: RancherKubeMetadata,
  status: {
    expiresAt: string
  }
}

interface ParsedInactivitySetting {
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

let storedUserActivityResponse: UserActivityResponse = {
  metadata: { name: '' },
  status:   { expiresAt: '' }
};

let sessionTokenName: string;

export async function checkBackendBasedSessionIdle(store: any): Promise<ParsedInactivitySetting> {
  let userActivity;
  const canListSettings = store.getters[`management/canList`](MANAGEMENT.SETTING);
  const canListUserAct = store.getters[`management/canList`](EXT.USER_ACTIVITY);
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

    const sessionToken = tokens.find((token: any) => {
      // this can be improved once https://github.com/rancher/rancher/issues/51580 is fixed
      // we should not need to store the UI session token name globally
      if (sessionTokenName) {
        return token.name === sessionTokenName;
      } else {
        return token.description === 'UI session' && token.current;
      }
    });

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
          userActivity = await createAndUpdateUserActivityToken(store, sessionTokenName);
        }

        if (userActivity) {
          const data = parseTTLData(userActivity);
          const shownAfter = Math.round(((data.showModalAfter || 0) / 60) * 100) / 100;
          const shownFor = Math.round(((data.courtesyTimer || 0) / 60) * 100) / 100;

          console.debug(`UI inactivity modal (backend-based) will show after ${ shownAfter }(m) and be shown for ${ shownFor }(m)`); // eslint-disable-line no-console

          return data;
        }

        console.error(`Could not find any user activity for token ${ sessionTokenName }`); // eslint-disable-line no-console

        return defaultParsedTTLData;
      } catch (e) {
        console.error(`Could not update user activity for token ${ sessionTokenName }`, e); // eslint-disable-line no-console

        return defaultParsedTTLData;
      }
    } else if (ttlIdleValue === ttlValue) {
      console.warn('ttlIdleValue === ttlValue, so backend-based session timeout is NOT enabled'); // eslint-disable-line no-console
    }
  } else {
    console.error('Cannot find a userActivity for this session OR this user does not have permissions to list the necessary resources'); // eslint-disable-line no-console
  }

  return defaultParsedTTLData;
}

export async function checkUserActivityData(store: any, sessionTokenName: string): Promise<UserActivityResponse> {
  try {
    const updatedData = await store.dispatch('management/find', { type: EXT.USER_ACTIVITY, id: sessionTokenName });

    // update stored data
    storedUserActivityResponse = updatedData;

    return updatedData;
  } catch (e: any) {
    console.error(`Could not GET UserActivity for session token ${ sessionTokenName }`, e); // eslint-disable-line no-console

    throw new Error(e);
  }
}

export async function createAndUpdateUserActivityToken(store: any, sessionTokenName: string):Promise<UserActivityResponse> {
  const updateUserActivity = await store.dispatch('management/create', {
    apiVersion: 'ext.cattle.io/v1',
    kind:       'UserActivity',
    type:       EXT.USER_ACTIVITY,
    metadata:   { name: sessionTokenName },
    spec:       { tokenId: sessionTokenName }
  });

  console.error('updateUserActivity', updateUserActivity);

  try {
    const savedData = await updateUserActivity.save();

    // update stored data
    storedUserActivityResponse = savedData;

    return savedData;
  } catch (e: any) {
    console.error(`Could not update (POST) UserActivity for session token ${ sessionTokenName }`, e); // eslint-disable-line no-console

    throw new Error(e);
  }
}

export function parseTTLData(userActivityData: UserActivityResponse): ParsedInactivitySetting {
  const currDate = Date.now();
  const endDate = new Date(userActivityData.status?.expiresAt).getTime();

  // let's give this a 3 second buffer so that we can make sure the logout happens by the frontend
  const thresholdSeconds = Math.floor((endDate - currDate) / 1000) - 3;

  // Amount of time the user sees the inactivity warning
  const courtesyTimerVal = Math.floor(thresholdSeconds * 0.1); // the modal is shown for 10% of the total time to display
  const courtesyTimer = Math.min(courtesyTimerVal, 60 * 5); // Never show the modal more than 5 minutes

  const courtesyCountdown = courtesyTimer;

  // Amount of time before the user sees the inactivity warning
  // Note - time before warning is shown + time warning is shown = settings threshold (total amount of time)
  const showModalAfter = thresholdSeconds - courtesyTimer;

  console.log('currDate', currDate);
  console.log('endDate', endDate);
  console.log('thresholdSeconds', thresholdSeconds);
  console.log('courtesyTimer', courtesyTimer);
  console.log('courtesyCountdown', courtesyCountdown);
  console.log('showModalAfter', showModalAfter);

  return {
    enabled:          true,
    expiresAt:        userActivityData.status?.expiresAt,
    sessionTokenName: userActivityData.metadata?.name,
    courtesyTimer,
    courtesyCountdown,
    showModalAfter
  };
}
