import { markRaw } from 'vue';
import semver from 'semver';
import { getVersionData } from '@shell/config/version';
import { READ_WHATS_NEW } from '@shell/store/prefs';
import { compare, parse } from '@shell/utils/version';

// Read like the release notes notification (shell/utils/release-notes.ts), without the build suffix (e.g. '-head')
const parseVersion = () => semver.coerce(getVersionData().Version.split('-')[0]);

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

  const lastRead = getters['prefs/get'](READ_WHATS_NEW);
  const lastReadMinor = parse(lastRead).slice(0, 2).join('.');

  return !lastRead || compare(lastReadMinor, version) < 0;
}

/**
 * Open the welcome modal straight away, it loads its content itself. It can be reopened from the user menu
 */
export async function openReleaseWelcome(commit: any) {
  // Loaded first: the ModalManager lets the dialog render its own RcModal when it sees its `modal` prop
  const dialog = (await import('@shell/dialog/ReleaseWelcomeDialog.vue')).default;

  commit('modal/openModal', { component: markRaw(dialog) });
}

export async function showReleaseWelcomeIfNew(commit: any, getters: any) {
  if (shouldShowReleaseWelcome(getters)) {
    await openReleaseWelcome(commit);
  }
}
