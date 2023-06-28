import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import PasswordPo from '@/cypress/e2e/po/components/password.po';

export class RancherSetupAuthVerifyPage extends PagePo {
  static url = '/auth/login'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(RancherSetupAuthVerifyPage.url);
  }

  constructor() {
    super(RancherSetupAuthVerifyPage.url);
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
