import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { WORKLOAD_OVERVIEW_LOADED_SELECTOR } from '@/cypress/e2e/po/pages/explorer/workload-dashboard.po';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

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
 * So after landing on the overview we wait for it to finish loading - the bento-grid (populated) or
 * the empty state - before navigating to the target type. Once the overview has rendered its loaded
 * state the summary has settled, so the premature-counts redirect no longer fires and the entry
 * click lands on the type we asked for.
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
