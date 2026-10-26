import PagePo from '@/cypress/e2e/po/pages/page.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

export class PersistentVolumeClaimsPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/persistentvolumeclaim`;
  }

  urlPath(clusterId = 'local') {
    return PersistentVolumeClaimsPagePo.createPath(clusterId);
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(PersistentVolumeClaimsPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Storage');
    sideNav.navToSideMenuEntryByLabel('PersistentVolumeClaims');
  }

  constructor(clusterId = 'local') {
    super(PersistentVolumeClaimsPagePo.createPath(clusterId));
  }

  list() {
    return new BaseResourceList(this.self());
  }

  clickCreate() {
    return this.list().masthead().create();
  }

  listElementWithName(name:string) {
    return this.list().resourceTable().sortableTable().rowElementWithName(name);
  }
}

export class PersistentVolumeClaimDetailPagePo extends BaseDetailPagePo {
  private static createPath(clusterId: string, namespace: string, name: string) {
    return `/c/${ clusterId }/explorer/persistentvolumeclaim/${ namespace }/${ name }`;
  }

  constructor(namespace: string, name: string, clusterId = 'local') {
    super(PersistentVolumeClaimDetailPagePo.createPath(clusterId, namespace, name));
  }

  clickPodsTab() {
    return this.resourceDetail().tabs().clickTabWithName('mounted-pods');
  }

  podsTabPanel() {
    return this.self().find('[data-testid="tab-panel-mounted-pods"]');
  }

  podsList() {
    return this.resourceDetail().tabbedList('mounted-pods');
  }
}
