import { markRaw } from 'vue';
import semver from 'semver';
import { getVersionData } from '@shell/config/version';
import { READ_RELEASE_WELCOME } from '@shell/store/prefs';

// Read like the release notes notification (shell/utils/release-notes.ts), without the build suffix (e.g. '-head')
const parseVersion = () => semver.coerce(getVersionData().Version.split('-')[0]);

/**
 * Running version of Rancher (e.g. '2.16.1'), or undefined when the version can't be parsed (e.g. dev builds)
 */
export function runningVersion(): string | undefined {
  return parseVersion()?.version;
}

/**
 * Minor version of the running Rancher (e.g. '2.16'), or undefined when the version can't be parsed (e.g. dev builds)
 */
export function releaseWelcomeVersion(): string | undefined {
  const version = parseVersion();

  return version ? `${ version.major }.${ version.minor }` : undefined;
}

/**
 * Shown on the first load and after an upgrade to a newer minor version, not after a patch.
 * Not in single product mode (e.g. Harvester), the content is about Rancher
 */
export function shouldShowReleaseWelcome(getters: any): boolean {
  const version = releaseWelcomeVersion();

  if (!version || getters['isSingleProduct']) {
    return false;
  }

  const lastRead = semver.coerce(getters['prefs/get'](READ_RELEASE_WELCOME));

  return !lastRead || semver.lt(lastRead, `${ version }.0`);
}

/**
 * Open the welcome modal straight away, it loads its content itself, and mark it as read. It can be reopened from the user menu
 */
export async function openReleaseWelcome(commit: any, dispatch: any) {
  const version = releaseWelcomeVersion();
  // Loaded first: the ModalManager lets the dialog render its own RcModal when it sees its `modal` prop
  const dialog = (await import('@shell/dialog/ReleaseWelcomeDialog.vue')).default;

  commit('modal/openModal', { component: markRaw(dialog) });

  if (version) {
    try {
      await dispatch('prefs/set', { key: READ_RELEASE_WELCOME, value: version });
    } catch (e) {
      // Not saved: the modal is shown again on the next login
      console.warn('Unable to mark the welcome modal as read', e); // eslint-disable-line no-console
    }
  }
}

export async function showReleaseWelcomeIfNew(commit: any, dispatch: any, getters: any) {
  if (shouldShowReleaseWelcome(getters)) {
    await openReleaseWelcome(commit, dispatch);
  }
}
