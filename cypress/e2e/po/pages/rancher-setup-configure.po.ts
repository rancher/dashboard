import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import PasswordPo from '@/cypress/e2e/po/components/password.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';

export class RancherSetupConfigurePage extends PagePo {
  static url = '/auth/setup'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(RancherSetupConfigurePage.url);
  }

  constructor() {
    super(RancherSetupConfigurePage.url);
  }

  choosePassword(): RadioGroupInputPo {
    return new RadioGroupInputPo(cy.getId('setup-password-mode'));
  }

  password(): PasswordPo {
    return new PasswordPo(cy.getId('setup-password'));
  }

  confirmPassword(): PasswordPo {
    return new PasswordPo(cy.getId('setup-password-confirm'));
  }

  serverUrl(): LabeledInputPo {
    return new LabeledInputPo(cy.getId('setup-server-url'));
  }

  serverUrlLocalhostWarningBanner(): BannersPo {
    return new BannersPo('[data-testid="setup-serverurl-localhost-warning"]');
  }

  errorBannerContent(label: string): Cypress.Chainable {
    return new BannersPo('[data-testid="setup-error-banner"]', this.self()).banner().contains(label);
  }

  termsAgreement(): CheckboxInputPo {
    return new CheckboxInputPo(cy.getId('setup-agreement'));
  }

  canSubmit(): Cypress.Chainable<boolean> {
    return this.submitButton().isDisabled().then((isDisabled) => !isDisabled);
  }

  submit(): Cypress.Chainable {
    return this.submitButton().click();
  }

  private submitButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="setup-submit"]', this.self());
  }
}
