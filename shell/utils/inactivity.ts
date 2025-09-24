import { EXT } from '@shell/config/types';
import { RancherKubeMetadata } from '@shell/types/kube/kube-api';

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

// store in memory the userActivity resource
let storedUserActivityResponse: UserActivityResponse = {
  metadata: { name: '' },
  status:   { expiresAt: '' }
};

// store in memory the session token name (this is the identifier for the correct user activity resource)
let sessionTokenName: string;

export function getSessionTokenName():string {
  return sessionTokenName;
}

export function storeSessionTokenName(tokenName: string) {
  sessionTokenName = tokenName;
}

export function getStoredUserActivity():UserActivityResponse {
  return storedUserActivityResponse;
}

export function storeUserActivity(userActivity: UserActivityResponse) {
  storedUserActivityResponse = userActivity;
}

export async function checkUserActivityData(store: any, sessionTokenName: string): Promise<UserActivityResponse> {
  // needs "force" for reactivity
  try {
    const updatedData = await store.dispatch('management/find', {
      type: EXT.USER_ACTIVITY, id: sessionTokenName, opt: { force: true }
    });

    // update stored data
    storedUserActivityResponse = updatedData;

    return updatedData;
  } catch (e: any) {
    console.error(`Could not GET UserActivity for session token ${ sessionTokenName }`, e); // eslint-disable-line no-console

    throw new Error(e);
  }
}

export async function updateUserActivityToken(store: any, sessionTokenName: string):Promise<UserActivityResponse> {
  const updateUserActivity = await store.dispatch('management/create', {
    apiVersion: 'ext.cattle.io/v1',
    kind:       'UserActivity',
    type:       EXT.USER_ACTIVITY,
    metadata:   { name: sessionTokenName },
    spec:       { tokenId: sessionTokenName }
  });

  try {
    const savedData = await updateUserActivity.save({ force: true });

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

  return {
    enabled:          true,
    expiresAt:        userActivityData.status?.expiresAt,
    sessionTokenName: userActivityData.metadata?.name,
    courtesyTimer,
    courtesyCountdown,
    showModalAfter
  };
}
