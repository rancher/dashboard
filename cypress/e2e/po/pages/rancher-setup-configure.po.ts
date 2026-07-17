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

  /**
   * Retry-able assertion that the submit button is enabled.
   * Prefer this over `canSubmit().should('eq', true)`: `canSubmit()` reads the
   * `disabled` attribute once through a non-retry-able `.then()`, so it races the
   * reactive tick that toggles the button state. `.should('not.have.attr', ...)`
   * retries until Vue settles.
   */
  submitShouldBeEnabled(): Cypress.Chainable {
    return this.submitButton().expectToBeEnabled();
  }

  /**
   * Retry-able assertion that the submit button is disabled (see `submitShouldBeEnabled`).
   */
  submitShouldBeDisabled(): Cypress.Chainable {
    return this.submitButton().expectToBeDisabled();
  }

  submit(): Cypress.Chainable {
    return this.submitButton().click();
  }

  private submitButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="setup-submit"]', this.self());
  }
}
