import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { WORKLOAD_OVERVIEW_LOADED_SELECTOR } from '@/cypress/e2e/po/pages/explorer/workload-dashboard.po';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

/**
 * Navigate to a Workloads sub-type via the side menu.
 *
 * Clicking the 'Workloads' group lands on the workload overview, which asynchronously fetches a
 * per-type summary before rendering. Clicking the target type while that load is still in flight can
 * race the nav re-render. So after landing on the overview we wait for it to finish loading - the
 * bento-grid (populated) or the empty state - before navigating to the target type.
 *
 * Note: the overview redirects to the Deployments list when a summary response is malformed - e.g. a
 * list-shaped body with `data` but no `summary` - and then keeps redirecting until a reload
 * (shell/pages/c/_cluster/explorer/workload-dashboard/composable.ts). The "pagination is hidden"
 * tests avoid tripping that by letting the overview's `summaryonly` request reach the real backend
 * instead of answering it with their small list mock (see the generate*DataSmall blueprints).
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
    const overviewLoaded = !!win.document.querySelector(WORKLOAD_OVERVIEW_LOADED_SELECTOR);

    expect(overviewLoaded, 'settled on the loaded workloads overview').to.be.true;
  });

  sideNav.navToSideMenuEntryByLabel(entryLabel);
};
