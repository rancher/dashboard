import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

export class LoggingClusterFlowListPagePo extends BaseListPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/logging/logging.banzaicloud.io.clusterflow`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(LoggingClusterFlowListPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(LoggingClusterFlowListPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Logging');
    sideNav.navToSideMenuEntryByLabel('ClusterFlow');
  }
}

export class LoggingClusterFlowCreateEditPagePo extends BaseDetailPagePo {
  private static createPath(clusterId: string, namespace?: string, id?: string ) {
    const root = `/c/${ clusterId }/logging/logging.banzaicloud.io.clusterflow`;

    return id ? `${ root }/${ namespace }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId: string, namespace?: string, id?: string) {
    super(LoggingClusterFlowCreateEditPagePo.createPath(clusterId, namespace, id));
  }

  outputsTab() {
    return new TabbedPo().clickTabWithSelector('[data-testid="btn-outputs"]');
  }

  outputSelector() {
    return new LabeledSelectPo('section#outputs .labeled-select');
  }

  ruleItem(index: number) {
    return new ArrayListPo(this.self()).arrayListItem(index);
  }

  matchesList() {
    return new ArrayListPo('section#match .array-list-grouped');
  }

  /**
   * Sets multiple namespace values for a match rule at the specified index
   * @param arrayListIndex - The index of the match rule in the array list
   * @param values - Array of namespace values to select
   */
  setNamespaceValueByLabel(arrayListIndex: number, values: string[]) {
    const item = this.matchesList().arrayListItem(arrayListIndex);
    const select = new LabeledSelectPo(item.find('.row:nth-of-type(2) .unlabeled-select'));

    select.toggle();
    values.forEach((value) => {
      select.clickOptionWithLabel(value);
    });
  }
}

export class LoggingClusterFlowDetailPagePo extends BaseDetailPagePo {
  static url: string;

  private static createPath( clusterId: string, namespace: string, id: string ) {
    const urlStr = `/c/${ clusterId }/logging/logging.banzaicloud.io.clusterflow/${ namespace }/${ id }`;

    return urlStr;
  }

  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(this.url);
  }

  constructor(clusterId = 'local', namespace: string, id: string) {
    super(LoggingClusterFlowDetailPagePo.createPath(clusterId, namespace, id));

    LoggingClusterFlowDetailPagePo.url = LoggingClusterFlowDetailPagePo.createPath(clusterId, namespace, id);
  }

  outputsTab() {
    return new TabbedPo().clickTabWithSelector('[data-testid="btn-outputs"]');
  }

  outputSelector() {
    return new LabeledSelectPo('section#outputs .labeled-select');
  }

  ruleItem(index: number) {
    return new ArrayListPo(this.self()).arrayListItem(index);
  }
}
