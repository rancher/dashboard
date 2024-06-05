import { install as installLoadInitialSettings } from '@shell/config/router/navigation-guards/load-initial-settings';
import { install as installAttemptFirstLogin } from '@shell/config/router/navigation-guards/attempt-first-login';

/**
 * Install our router navigation guards. i.e. router.beforeEach(), router.afterEach()
 */
export function installNavigationGuards(router, context) {
  // NOTE: the order of the installation matters.
  // Be intentional when adding, removing or modifying the guards that are installed.

  const navigationGuardInstallers = [installLoadInitialSettings, installAttemptFirstLogin];

  navigationGuardInstallers.forEach((installer) => installer(router, context));
}
