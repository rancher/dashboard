import PagePo from '@/cypress/integration/po/pages/page.po';
import LabeledInputPo from '@/cypress/integration/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/integration/po/components/async-button.po';

export class LoginPagePo extends PagePo {
  static url: string = '/auth/login'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(LoginPagePo.url);
  }

  constructor() {
    super(LoginPagePo.url);
  }

  username(): LabeledInputPo {
    return new LabeledInputPo(cy.getId('local-login-username'));
  }

  password(): LabeledInputPo {
    return new LabeledInputPo(cy.getId('local-login-password'));
  }

  canSubmit(): Cypress.Chainable<boolean> {
    return this.submitButton().isDisabled().then(isDisabled => !isDisabled);
  }

  submit(): Cypress.Chainable {
    return this.submitButton().click();
  }

  switchToLocal(): Cypress.Chainable {
    const useLocal = this.useLocal();

    return useLocal ? useLocal.click() : cy;
  }

  useLocal() {
    return this.self().then(($page) => {
      const elements = $page.getId('login-useLocal');

      return elements?.[0];
    });
  }

  private submitButton(): AsyncButtonPo {
    return new AsyncButtonPo('data-testid="login-submit"', this.self());
  }
}
