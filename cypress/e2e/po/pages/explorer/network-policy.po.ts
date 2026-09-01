import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';

export class NetworkPolicyListPagePo extends BaseListPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/networking.k8s.io.networkpolicy`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(NetworkPolicyListPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Policy');
    sideNav.navToSideMenuEntryByLabel('Network Policies');
  }

  constructor(private clusterId = 'local') {
    super(NetworkPolicyListPagePo.createPath(clusterId));
  }
}

export class NetworkPolicyCreateEditPagePo extends BaseDetailPagePo {
  private static createPath(clusterId: string, namespace?: string, id?: string ) {
    const root = `/c/${ clusterId }/explorer/networking.k8s.io.networkpolicy`;

    return id ? `${ root }/${ namespace }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = 'local', namespace?: string, id?: string) {
    super(NetworkPolicyCreateEditPagePo.createPath(clusterId, namespace, id));
  }

  enableIngressCheckbox() {
    return new CheckboxInputPo('[data-testid="network-policy-ingress-enable-checkbox"]');
  }

  newNetworkPolicyRuleAddBtn() {
    return cy.get('[data-testid="tab-list-add"]');
  }

  addAllowedTrafficSourceButton() {
    return cy.get('[data-testid="array-list-button"]').contains('Add allowed traffic source');
  }

  addAllowedPortButton() {
    return cy.get('[data-testid="array-list-button"]').contains('Add allowed port');
  }

  ingressRuleItem(index: number) {
    return new ArrayListPo('section #rule-ingress0', this.self()).arrayListItem(index);
  }

  ingressRuleItemPortInput(index: number) {
    return this.ingressRuleItem(index).find('.col:nth-of-type(1) input');
  }

  policyRuleTargetSelect(index: number) {
    return new LabeledSelectPo(`[data-testid="policy-rule-target-${ index }"] [data-testid="policy-rule-target-type-labeled-select"]`, this.self());
  }

  matchingNamespacesMessage(index: number) {
    return new BannersPo(`[data-testid="policy-rule-target-${ index }"] [data-testid="matching-namespaces-message"]`);
  }

  policyRuleKeyInput(index: number) {
    return cy.get(`[data-testid="policy-rule-target-${ index }"] [data-testid="input-match-expression-key-control-0"]`);
  }
}
