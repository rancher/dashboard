import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';

export default class CreateEditNetworkPolicyPagePo extends PagePo {
  private static createPath(clusterId: string, namespace?: string, id?: string ) {
    const root = `/c/${ clusterId }/explorer/networking.k8s.io.networkpolicy`;

    return id ? `${ root }/${ namespace }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = 'local', namespace?: string, id?: string) {
    super(CreateEditNetworkPolicyPagePo.createPath(clusterId, namespace, id));
  }

  nameInput() {
    return LabeledInputPo.bySelector(this.self(), '[data-testid="name-ns-description-name"]');
  }

  descriptionInput() {
    return LabeledInputPo.byLabel(this.self(), 'Description');
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

  policyRuleTargetSelect(index: number) {
    return new LabeledSelectPo(`[data-testid="policy-rule-target-${ index }"] [data-testid="policy-rule-target-type-labeled-select"]`, this.self());
  }

  matchingNamespacesMessage(index: number) {
    return new BannersPo(`[data-testid="policy-rule-target-${ index }"] [data-testid="matching-namespaces-message"]`, this.self()).bannerElement('span');
  }

  policyRuleKeyInput(index: number) {
    return cy.get(`[data-testid="policy-rule-target-${ index }"] [data-testid="input-match-expression-key-control-0"]`);
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  editAsYaml() {
    return new AsyncButtonPo('[data-testid="form-yaml"]', this.self());
  }

  yamlEditor(): CodeMirrorPo {
    return CodeMirrorPo.bySelector(this.self(), '[data-testid="yaml-editor-code-mirror"]');
  }
}
