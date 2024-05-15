import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';

export default class SettingsEditPo extends PagePo {
  private static createPath(clusterId: string, setting: string) {
    return `/c/${ clusterId }/settings/management.cattle.io.setting/${ setting }?mode=edit`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', setting: string) {
    super(SettingsEditPo.createPath(clusterId, setting));
  }

  title() {
    return this.self().get('.title .primaryheader  h1');
  }

  settingsInput(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Value');
  }

  settingsRadioBtn(): RadioGroupInputPo {
    return new RadioGroupInputPo('[data-testid="input-setting-boolean"]');
  }

  selectSettingsByLabel(label: string) {
    const selectSettings = new LabeledSelectPo(`[data-testid="input-setting-enum"]`, this.self());

    selectSettings.toggle();
    selectSettings.clickOptionWithLabel(label);
  }

  serverUrlLocalhostWarningBanner(): BannersPo {
    return new BannersPo('[data-testid="setting-serverurl-localhost-warning"]');
  }

  errorBannerContent(label: string): Cypress.Chainable {
    return new BannersPo('[data-testid="setting-error-banner"]', this.self()).banner().contains(label);
  }

  useDefaultButton(): Cypress.Chainable {
    return cy.getId('advanced_settings_use_default');
  }

  saveButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  saveAndWait(endpoint: string, value?: string): Cypress.Chainable {
    const interceptName = value ? `${ endpoint }-${ value }${ Date.now() }` : `${ endpoint }${ Date.now() }`;

    cy.intercept('PUT', `/v1/management.cattle.io.settings/${ endpoint }`).as(interceptName);
    this.saveButton().click();

    return cy.wait(`@${ interceptName }`, { timeout: 10000 });
  }
}
