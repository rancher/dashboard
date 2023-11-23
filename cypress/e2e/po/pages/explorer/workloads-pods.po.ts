import PagePo from '@/cypress/e2e/po/pages/page.po';
import PodsListPo from '@/cypress/e2e/po/lists/pods-list.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
export class WorkloadsPodsListPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/pod`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(WorkloadsPodsListPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(WorkloadsPodsListPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    BurgerMenuPo.toggle();
    burgerMenu.clusters().contains(clusterId).click();
    sideNav.navToSideMenuGroupByLabel('Workloads');
    sideNav.navToSideMenuEntryByLabel('Pods');
  }

  list(): PodsListPo {
    return new PodsListPo('[data-testid="cluster-list-container"]');
  }

  sortableTable() {
    return this.list().resourceTable().sortableTable();
  }

  createPod() {
    return this.list().masthead().actions().eq(0)
      .click();
  }
}

export class WorkLoadsPodDetailsPagePo extends PagePo {
  static url: string;

  private static createPath(podId: string, clusterId: string, namespaceId: string, queryParams?: Record<string, string>) {
    const urlStr = `/c/${ clusterId }/explorer/pod/${ namespaceId }/${ podId }`;

    if (!queryParams) {
      return urlStr;
    }

    const params = new URLSearchParams(queryParams);

    return `${ urlStr }?${ params.toString() }`;
  }

  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(this.url);
  }

  constructor(podId: string, queryParams?: Record<string, string>, clusterId = 'local', namespaceId = 'default') {
    super(WorkLoadsPodDetailsPagePo.createPath(podId, clusterId, namespaceId, queryParams));

    WorkLoadsPodDetailsPagePo.url = WorkLoadsPodDetailsPagePo.createPath(podId, clusterId, namespaceId, queryParams);
  }
}
