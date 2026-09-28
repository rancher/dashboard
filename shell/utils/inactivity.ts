import { EXT } from '@shell/config/types';
import { SteveGetResponse } from '@shell/types/rancher/steve.api';

interface UserActivityResponse extends SteveGetResponse {
  status: {
    expiresAt: string
  }
}

interface ParsedInactivitySetting {
  expiresAt: string | undefined,
  sessionTokenName: string | undefined,
  courtesyTimer: number | undefined,
  courtesyCountdown: number | undefined,
  showModalAfter: number | undefined
}

interface SpecData {
  tokenId: string;
  seenAt?: string;
}

export class Inactivity {
  private sessionTokenName: string | undefined = undefined;

  public getSessionTokenName(): string | undefined {
    return this.sessionTokenName;
  }

  public setSessionTokenName(tokenName: string): void {
    this.sessionTokenName = tokenName;
  }

  public async getUserActivity(store: any, sessionTokenName: string, force = true): Promise<UserActivityResponse> {
    try {
      const updatedData = await store.dispatch('management/find', {
        type: EXT.USER_ACTIVITY,
        id:   sessionTokenName,
        opt:  {
          force, watch: false, logoutOnError: false
        }
      });

      return updatedData;
    } catch (e: any) {
      if (e._status === 401) {
        return store.dispatch('auth/logout', { sessionIdle: true });
      }

      console.error(`Could not GET UserActivity for session token ${ sessionTokenName }`, e); // eslint-disable-line no-console
      throw new Error(e);
    }
  }

  public async updateUserActivity(userActivityResource: any, sessionTokenName: string, seenAt: string): Promise<UserActivityResponse> {
    const spec: SpecData = { tokenId: sessionTokenName };

    if (seenAt) {
      spec.seenAt = seenAt;
    }

    userActivityResource.spec = spec;

    try {
      const savedData = await userActivityResource.save({ force: true });

      return savedData;
    } catch (e: any) {
      console.error(`Could not update (POST) UserActivity for session token ${ sessionTokenName }`, e); // eslint-disable-line no-console
      throw new Error(e);
    }
  }

  public parseTTLData(userActivityData: UserActivityResponse): ParsedInactivitySetting {
    const currDate = Date.now();
    const endDate = new Date(userActivityData.status?.expiresAt).getTime();

    // let's give this a 3 second buffer so that we can make sure the logout happens by the frontend
    const thresholdSeconds = Math.floor((endDate - currDate) / 1000) - 3;

    // Amount of time the user sees the inactivity warning
    const courtesyTimerVal = Math.floor(thresholdSeconds * 0.2); // the modal is shown for 10% of the total time to display
    const courtesyTimer = Math.min(courtesyTimerVal, 60 * 5); // Never show the modal more than 5 minutes

    const courtesyCountdown = courtesyTimer;

    // Amount of time before the user sees the inactivity warning
    // Note - time before warning is shown + time warning is shown = settings threshold (total amount of time)
    const showModalAfter = thresholdSeconds - courtesyTimer;

    return {
      expiresAt:        userActivityData.status?.expiresAt,
      sessionTokenName: userActivityData.metadata?.name,
      courtesyTimer,
      courtesyCountdown,
      showModalAfter
    };
  }
}

const instance = new Inactivity();

export default instance;
