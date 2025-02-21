import { install as installLoadInitialSettings } from '@shell/config/router/navigation-guards/load-initial-settings';
import { install as installRecordLastRoute } from '@shell/config/router/navigation-guards/record-last-route';
import { install as installAttemptFirstLogin } from '@shell/config/router/navigation-guards/attempt-first-login';
import { install as installAuthentication } from '@shell/config/router/navigation-guards/authentication';
import { install as installRuntimeExtensionRoute } from '@shell/config/router/navigation-guards/runtime-extension-route';
import { install as installI18N } from '@shell/config/router/navigation-guards/i18n';
import { install as installProducts } from '@shell/config/router/navigation-guards/products';
import { install as installClusters } from '@shell/config/router/navigation-guards/clusters';
import { install as installHandleInstallRedirect } from '@shell/config/router/navigation-guards/install-redirect';
import { install as installPageTitle } from '@shell/config/router/navigation-guards/page-title';
import { install as installServerUpgradeGrowl } from '@shell/config/router/navigation-guards/server-upgrade-growl';

/**
 * Install our router navigation guards. i.e. router.beforeEach(), router.afterEach()
 */
export function installNavigationGuards(router, context) {
  // NOTE: the order of the installation matters.
  // Be intentional when adding, removing or modifying the guards that are installed.

  const navigationGuardInstallers = [installLoadInitialSettings, installAttemptFirstLogin, installAuthentication, installProducts, installClusters, installRuntimeExtensionRoute, installI18N, installHandleInstallRedirect, installPageTitle, installRecordLastRoute, installServerUpgradeGrowl];

  navigationGuardInstallers.forEach((installer) => installer(router, context));
}
