import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { WORKLOAD_OVERVIEW_LOADED_SELECTOR } from '@/cypress/e2e/po/pages/explorer/workload-dashboard.po';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

const DEPLOYMENTS_LIST_FRAGMENT = '/explorer/apps.deployment';

/**
 * Navigate to a Workloads sub-type via the side menu.
 *
 * Clicking the 'Workloads' group lands on the workload overview, which fires one summary request per
 * workload type. If any type's counts aren't populated yet the overview redirects to the Deployments
 * list AND flags the cluster in an in-memory set that keeps redirecting until a page reload
 * (shell/pages/c/_cluster/explorer/workload-dashboard/composable.ts). Clicking the target type while
 * that summary fetch is still in flight races the redirect / nav re-render and lands on the wrong
 * type.
 *
 * So after landing on the overview we wait for it to settle into one of its two stable outcomes -
 * the overview finished loading (bento-grid or empty state), OR it redirected to the Deployments
 * list - then navigate to the target type from wherever we ended up. We must check BOTH (not just
 * the overview): if it redirected, the overview never renders, so waiting only for it would hang.
 * The entry click resolves the same from either page and a resource-list route never re-enters the
 * overview, so no reload/retry is needed.
 */
export const navToWorkloadTypeViaSideMenu = (
  clusterId: string,
  entryLabel: string,
): void => {
  const burgerMenu = new BurgerMenuPo();
  const sideNav = new ProductNavPo();

  burgerMenu.goToCluster(clusterId);
  sideNav.navToSideMenuGroupByLabel('Workloads');

  cy.window(LONG_TIMEOUT_OPT).should((win) => {
    const onDeployments = win.location.pathname.includes(DEPLOYMENTS_LIST_FRAGMENT);
    const overviewLoaded = !!win.document.querySelector(WORKLOAD_OVERVIEW_LOADED_SELECTOR);

    expect(onDeployments || overviewLoaded, 'settled on the loaded workloads overview or the deployments redirect').to.be.true;
  });

  sideNav.navToSideMenuEntryByLabel(entryLabel);
};
