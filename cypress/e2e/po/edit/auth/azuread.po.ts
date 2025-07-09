import PagePo from '@/cypress/e2e/po/pages/page.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

export default class AzureadPo extends PagePo {
  private static createPath(clusterId: string, id?: string ) {
    return `/c/${ clusterId }/auth/config/azuread?mode=edit`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(AzureadPo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(AzureadPo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Users & Authentication');
    sideNav.navToSideMenuEntryByLabel('Auth Provider');
  }

  endpointsRadioBtn(): RadioGroupInputPo {
    return new RadioGroupInputPo('[data-testid="endpoints-radio-input"]');
  }

  selectEndpointsOption(index: number): Cypress.Chainable {
    const radioButton = new RadioGroupInputPo('[data-testid="endpoints-radio-input"]');

    return radioButton.set(index);
  }

  tenantIdInputField() {
    return this.self().get('[data-testid="input-azureAD-tenantId"]').invoke('val');
  }

  enterTenantId(name: string) {
    return new LabeledInputPo('[data-testid="input-azureAD-tenantId"]').set(name);
  }

  applicationIdInputField() {
    return this.self().get('[data-testid="input-azureAD-applcationId"]').invoke('val');
  }

  enterApplicationId(name: string) {
    return new LabeledInputPo('[data-testid="input-azureAD-applcationId"]').set(name);
  }

  applicationSecretInputField() {
    return this.self().get('[data-testid="input-azureAD-applicationSecret"]').invoke('val');
  }

  enterApplicationSecret(name: string) {
    return new LabeledInputPo('[data-testid="input-azureAD-applicationSecret"]').set(name);
  }

  groupMembershipFilterCheckbox() {
    return new CheckboxInputPo('[data-testid="checkbox-azureAD-groupMembershipFilter"]');
  }

  enterGroupMembershipFilter(text: string) {
    return new LabeledInputPo('[data-testid="input-azureAD-groupMembershipFilter"]').set(text);
  }

  endpointInputField() {
    return this.self().get('[data-testid="input-azureAD-endpoint"]').invoke('val');
  }

  enterEndpoint(name: string) {
    return new LabeledInputPo('[data-testid="input-azureAD-endpoint"]').set(name);
  }

  graphEndpointInputField() {
    return this.self().get('[data-testid="input-azureAD-graphEndpoint"]').invoke('val');
  }

  enterGraphEndpoint(name: string) {
    return new LabeledInputPo('[data-testid="input-azureAD-graphEndpoint"]').set(name);
  }

  tokenEndpointInputField() {
    return this.self().get('[data-testid="input-azureAD-tokenEndpoint"]').invoke('val');
  }

  enterTokenEndpoint(name: string) {
    return new LabeledInputPo('[data-testid="input-azureAD-tokenEndpoint"]').set(name);
  }

  authEndpointInputField() {
    return this.self().get('[data-testid="input-azureAD-authEndpoint"]').invoke('val');
  }

  enterAuthEndpoint(name: string) {
    return new LabeledInputPo('[data-testid="input-azureAD-authEndpoint"]').set(name);
  }

  saveButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  save() {
    return new AsyncButtonPo('[data-testid="form-save"]').click();
  }

  permissionsWarningBanner() {
    return this.self().get('[data-testid="auth-provider-admin-permissions-warning-banner"]');
  }
}
