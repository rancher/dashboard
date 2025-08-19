import { MANAGEMENT, EXT, NORMAN } from '@shell/config/types';
import { DEFAULT_PERF_SETTING, SETTING } from '@shell/config/settings';

interface UIInactivitySettingResponse {
  enabled: boolean,
  sessionTokenName?: string | undefined,
  courtesyTimer: number | undefined,
  courtesyCountdown: number | undefined,
  showModalAfter: number | undefined
}

export async function checkIfUIInactivityIsEnabled(store: any): Promise<UIInactivitySettingResponse> {
  let settings;

  try {
    const settingsString = await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.UI_PERFORMANCE });

    settings = settingsString?.value ? JSON.parse(settingsString.value) : DEFAULT_PERF_SETTING;
  } catch {}

  if (settings?.inactivity?.enabled) {
    const data = parseTTLData(settings?.inactivity?.threshold * 60);

    console.debug(`UI inactivity modal (frontend) will show after ${ data.showModalAfter || 0 / 60 }(m) and be shown for ${ data.courtesyTimer || 0 / 60 }(m)`); // eslint-disable-line no-console

    return data;
  }

  return {
    enabled:           false,
    courtesyTimer:     undefined,
    courtesyCountdown: undefined,
    showModalAfter:    undefined,
  };
}

export async function checkBackendBasedSessionIdle(store: any): Promise<UIInactivitySettingResponse> {
  let userActivity;
  let sessionTokenName;
  const canListUserAct = store.getters[`management/canList`](EXT.USERACTIVITY);
  const canListTokens = store.getters[`rancher/canList`](NORMAN.TOKEN);

  if (canListUserAct && canListTokens) {
    const tokens = await store.dispatch('rancher/findAll', { type: NORMAN.TOKEN });
    const sessionToken = tokens.find((token: any) => token.description === 'UI session' && token.current);

    if (sessionToken) {
      sessionTokenName = sessionToken.name;

      const userActivityData = await store.dispatch('management/find', { type: EXT.USERACTIVITY, id: sessionTokenName });

      if (userActivityData) {
        // this means that the feature hasn't been initialised yet OR it's the the first run of the component, we update it
        // because either way it's definitely a user interaction with Rancher
        userActivity = await updateUserActivityToken(store, sessionTokenName);

        console.error('DATA userActivity', userActivity);

        const currDate = Date.now();
        const endDate = new Date(userActivity.status?.expiresAt).getTime();
        const thresholdSeconds = Math.floor((endDate - currDate) / 1000);

        const data = parseTTLData(thresholdSeconds, sessionTokenName);

        console.error('DATA parseTTLData', data);

        console.debug(`UI inactivity modal (backend) will show after ${ data.showModalAfter || 0 / 60 }(m) and be shown for ${ data.courtesyTimer || 0 / 60 }(m)`); // eslint-disable-line no-console

        return data;
      }
    }
  }

  console.error('Cannot find a userActivity for this session OR this user does not have permissions to list the necessary resources'); // eslint-disable-line no-console

  return {
    enabled:           false,
    sessionTokenName,
    courtesyTimer:     undefined,
    courtesyCountdown: undefined,
    showModalAfter:    undefined,
  };
}

async function updateUserActivityToken(store: any, sessionTokenName?: string) {
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
  }
}

function parseTTLData(thresholdSeconds: number, sessionTokenName?: string): UIInactivitySettingResponse {
  // Amount of time the user sees the inactivity warning
  const courtesyTimerVal = Math.floor(thresholdSeconds * 0.1);
  const courtesyTimer = Math.min(courtesyTimerVal, 60 * 5); // Never show the modal more than 5 minutes

  const courtesyCountdown = courtesyTimer;

  // Amount of time before the user sees the inactivity warning
  // Note - time before warning is shown + time warning is shown = settings threshold (total amount of time)
  const showModalAfter = thresholdSeconds - courtesyTimer;

  const data:UIInactivitySettingResponse = {
    enabled: true,
    courtesyTimer,
    courtesyCountdown,
    showModalAfter,
  };

  if (sessionTokenName) {
    data.sessionTokenName = sessionTokenName;
  }

  return data;
}
