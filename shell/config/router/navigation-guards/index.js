import { install as installLoadInitialSettings } from '@shell/config/router/navigation-guards/load-initial-settings';
import { install as installAttemptFirstLogin } from '@shell/config/router/navigation-guards/attempt-first-login';
import { install as installAuthentication } from '@shell/config/router/navigation-guards/authentication';
import { install as installI18N } from '@shell/config/router/navigation-guards/i18n';

/**
 * Install our router navigation guards. i.e. router.beforeEach(), router.afterEach()
 */
export function installNavigationGuards(router, context) {
  // NOTE: the order of the installation matters.
  // Be intentional when adding, removing or modifying the guards that are installed.

  const navigationGuardInstallers = [installLoadInitialSettings, installAttemptFirstLogin, installAuthentication, installI18N];

  navigationGuardInstallers.forEach((installer) => installer(router, context));
}
