import { defineAsyncComponent } from 'vue';
import semver from 'semver';
import { getVersionData } from '@shell/config/version';
import { READ_RELEASE_WELCOME } from '@shell/store/prefs';
import { fetchFirstRunFeatures } from '@shell/utils/dynamic-content/first-run';

/**
 * Minor version of the running Rancher (e.g. '2.16'), or undefined when the version can't be parsed (e.g. dev builds)
 */
export function releaseWelcomeVersion(): string | undefined {
  const version = semver.coerce(getVersionData().Version);

  return version ? `${ version.major }.${ version.minor }` : undefined;
}

/**
 * The welcome modal is shown once per minor release: when the user has not read it for this minor version or a later one.
 * Not shown in single product mode (e.g. Harvester), the content is about Rancher
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
 * Open the welcome modal and mark it as read, it can be reopened from the user menu
 *
 * The "What's new" content can be updated after the release through dynamic content, the built-in content is used otherwise
 */
export async function openReleaseWelcome(commit: any, dispatch: any, getters: any, axios: any) {
  const version = releaseWelcomeVersion();
  const features = version ? await fetchFirstRunFeatures(getters, axios, version) : undefined;

  commit('modal/openModal', {
    component:           defineAsyncComponent(() => import('@shell/dialog/ReleaseWelcomeDialog.vue')),
    componentProps:      { features },
    modalWidth:          '900px',
    // Only informative, so Escape and clicking outside close it too
    closeOnClickOutside: true,
  });

  if (version) {
    try {
      await dispatch('prefs/set', { key: READ_RELEASE_WELCOME, value: version });
    } catch (e) {
      // Not saved: the modal is shown again on the next login
      console.warn('Unable to mark the welcome modal as read', e); // eslint-disable-line no-console
    }
  }
}

export async function showReleaseWelcomeIfNew(commit: any, dispatch: any, getters: any, axios: any) {
  if (shouldShowReleaseWelcome(getters)) {
    await openReleaseWelcome(commit, dispatch, getters, axios);
  }
}
