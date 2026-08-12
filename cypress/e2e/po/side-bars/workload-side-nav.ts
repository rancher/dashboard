import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import WorkloadDashboardPagePo from '@/cypress/e2e/po/pages/explorer/workload-dashboard.po';

/**
 * Navigate to a Workloads sub-type via the side menu.
 *
 * Clicking the 'Workloads' group lands on the workload overview, which fires one summary request per
 * workload type and redirects to the Deployments list if any counts aren't populated yet
 * (shell/pages/c/_cluster/explorer/workload-dashboard/composable.ts). Clicking the target type while
 * that summary fetch is still in flight races the redirect / nav re-render and lands on the wrong
 * type (usually Deployments).
 *
 * So we wait for the overview to finish loading - its bento-grid renders only once the summary fetch
 * has resolved - before navigating to the target type.
 */
export const navToWorkloadTypeViaSideMenu = (
  clusterId: string,
  entryLabel: string,
): void => {
  const burgerMenu = new BurgerMenuPo();
  const sideNav = new ProductNavPo();

  burgerMenu.goToCluster(clusterId);
  sideNav.navToSideMenuGroupByLabel('Workloads');
  new WorkloadDashboardPagePo(clusterId).waitForOverviewLoaded();
  sideNav.navToSideMenuEntryByLabel(entryLabel);
};
