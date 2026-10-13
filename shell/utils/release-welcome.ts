import { defineAsyncComponent } from 'vue';
import semver from 'semver';
import { getVersionData } from '@shell/config/version';
import { READ_RELEASE_WELCOME } from '@shell/store/prefs';
import { fetchFirstRunContent, hasExactFirstRunRelease } from '@shell/utils/dynamic-content/first-run';

/**
 * Running version of Rancher (e.g. '2.16.1'), or undefined when the version can't be parsed (e.g. dev builds)
 */
export function runningVersion(): string | undefined {
  return semver.coerce(getVersionData().Version)?.version;
}

/**
 * Minor version of the running Rancher (e.g. '2.16'), or undefined when the version can't be parsed (e.g. dev builds)
 */
export function releaseWelcomeVersion(): string | undefined {
  const version = semver.coerce(getVersionData().Version);

  return version ? `${ version.major }.${ version.minor }` : undefined;
}

/**
 * The welcome modal is shown once per minor release: when the user has not read it for this minor version or a later one.
 * It's shown again after an upgrade to a version with its own entry in the dynamic content (e.g. a Prime patch).
 * Not shown in single product mode (e.g. Harvester), the content is about Rancher
 */
export async function shouldShowReleaseWelcome(getters: any, axios: any): Promise<boolean> {
  const version = runningVersion();

  if (!version || getters['isSingleProduct']) {
    return false;
  }

  // Older values only hold the minor version (e.g. '2.16'), read as its first patch
  const lastRead = semver.coerce(getters['prefs/get'](READ_RELEASE_WELCOME));

  if (!lastRead || semver.lt(lastRead, `${ releaseWelcomeVersion() }.0`)) {
    return true;
  }

  return semver.gt(version, lastRead) && hasExactFirstRunRelease(getters, axios, version);
}

/**
 * Open the welcome modal and mark it as read, it can be reopened from the user menu
 *
 * The "What's new" features, the Prime promotion and the registration card can be updated after the release through dynamic
 * content, the built-in content is used otherwise
 */
export async function openReleaseWelcome(commit: any, dispatch: any, getters: any, axios: any) {
  const version = runningVersion();
  const {
    features, matchedVersion, primePromo, registration
  } = version ? await fetchFirstRunContent(getters, axios, version) : {};

  commit('modal/openModal', {
    component:      defineAsyncComponent(() => import('@shell/dialog/ReleaseWelcomeDialog.vue')),
    componentProps: {
      features, matchedVersion, primePromo, registration
    },
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
  if (await shouldShowReleaseWelcome(getters, axios)) {
    await openReleaseWelcome(commit, dispatch, getters, axios);
  }
}
