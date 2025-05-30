import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

export class IngressListPagePo extends BaseListPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/networking.k8s.io.ingress`;
  }

  urlPath(clusterId = 'local') {
    return IngressListPagePo.createPath(clusterId);
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(IngressListPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Service Discovery');
    sideNav.navToSideMenuEntryByLabel('Ingresses');
  }

  constructor(clusterId = 'local') {
    super(IngressListPagePo.createPath(clusterId));
  }
}

export class IngressCreateEditPo extends BaseDetailPagePo {
  private static createPath(clusterId: string, namespace?: string, id?: string ) {
    const root = `/c/${ clusterId }/explorer/networking.k8s.io.ingress`;

    return id ? `${ root }/${ namespace }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = 'local', namespace?: string, id?: string) {
    super(IngressCreateEditPo.createPath(clusterId, namespace, id));
  }

  rulesList() {
    return new ArrayListPo('section#rules .array-list-grouped');
  }

  setRuleRequestHostValue(arrayListIndex: number, value: string) {
    const item = this.rulesList().arrayListItem(arrayListIndex);

    new LabeledInputPo(item.find('#host .labeled-input').type(value));
  }

  setPathTypeByLabel(arrayListIndex: number, value: string) {
    const item = this.rulesList().arrayListItem(arrayListIndex);
    const select = new LabeledSelectPo(item.find('.col:nth-of-type(1) .unlabeled-select'));

    select.toggle();
    select.clickOptionWithLabel(value);
  }

  setTargetServiceValueByLabel(arrayListIndex: number, value: string) {
    const item = this.rulesList().arrayListItem(arrayListIndex);
    const select = new LabeledSelectPo(item.find('.col:nth-of-type(2) .unlabeled-select'));

    select.toggle();
    select.clickOptionWithLabel(value);
  }

  setPortValueByLabel(arrayListIndex: number, value: string) {
    const item = this.rulesList().arrayListItem(arrayListIndex);
    const select = new LabeledSelectPo(item.find('.col:nth-of-type(3) .unlabeled-select'));

    select.toggle();
    select.clickOptionWithLabel(value);
  }

  certificatesList() {
    return new ArrayListPo('section#certificates .array-list-grouped');
  }

  setSecretNameValueByLabel(arrayListIndex: number, value: string, parentIndex?: number) {
    const item = this.certificatesList().arrayListItem(arrayListIndex, parentIndex);
    const select = new LabeledSelectPo(item.find('.labeled-select'));

    select.toggle();
    select.clickOptionWithLabel(value);
  }

  setHostValueByIndex(arrayListIndex: number, value: string, parentIndex?: number) {
    const item = this.certificatesList().arrayListItem(arrayListIndex, parentIndex);

    new LabeledInputPo(item.find('.labeled-input').type(value));
  }
}

export class IngressDetailPagePo extends BaseDetailPagePo {
  private static createPath(clusterId: string, namespace: string, id: string) {
    return `/c/${ clusterId }/explorer/networking.k8s.io.ingress/${ namespace }/${ id }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = 'local', namespace: string, id: string) {
    super(IngressDetailPagePo.createPath(clusterId, namespace, id));
  }

  /**
   * @param tabId - the id of the tab
   * @param index - the index of the list (only used for 'related' tab)
   * @returns the list of the tab
   */
  list(tabId: 'rules' | 'events' | 'related', index?: number) {
    const baseSelector = `#${ tabId } [data-testid="sortable-table-list-container"]`;
    const selector = tabId === 'related' ? `${ baseSelector }:nth-of-type(${ index })` : baseSelector;

    return new ResourceTablePo(selector);
  }
}
