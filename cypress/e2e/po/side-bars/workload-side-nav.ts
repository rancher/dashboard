import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

/**
 * Navigate to a Workloads sub-type via the side menu.
 */
export const navToWorkloadTypeViaSideMenu = (
  clusterId: string,
  entryLabel: string,
): void => {
  const burgerMenu = new BurgerMenuPo();
  const sideNav = new ProductNavPo();

  burgerMenu.goToCluster(clusterId);
  sideNav.navToSideMenuGroupByLabel('Workloads');
  sideNav.navToSideMenuEntryByLabel(entryLabel);
};
