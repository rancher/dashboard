import PagePo from '@/cypress/integration/po/pages/page.po';
import AsyncButtonPo from '@/cypress/integration/po/components/async-button.po';
import FormPo from '@/cypress/integration/po/components/form.po';
import PasswordPo from '~/cypress/integration/po/components/password.po';

export class RancherSetupPagePo extends PagePo {
  static url: string = '/auth/login'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(RancherSetupPagePo.url);
  }

  form: FormPo;

  constructor() {
    super(RancherSetupPagePo.url);

    this.form = new FormPo('form', this.self());
  }

  hasInfoMessage() {
    this.self().getId('first-login-message').should('be.visible');
  }

  password(): PasswordPo {
    return new PasswordPo(cy.getId('local-login-password'));
  }

  canSubmit(): Cypress.Chainable<boolean> {
    return this.submitButton().isDisabled().then(isDisabled => !isDisabled);
  }

  submit(): Cypress.Chainable {
    return this.submitButton().click();
  }

  private submitButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="login-submit"]', this.self());
  }
}
