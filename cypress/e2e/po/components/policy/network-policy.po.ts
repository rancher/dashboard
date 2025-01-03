import CreateEditViewPo from '@/cypress/e2e/po/components/create-edit-view.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
export default class NetworkPolicyPo extends CreateEditViewPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
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
