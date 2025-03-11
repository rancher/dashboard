import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import PasswordPo from '@/cypress/e2e/po/components/password.po';

export class LoginPagePo extends PagePo {
  static url = '/auth/login'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(LoginPagePo.url);
  }

  constructor() {
    super(LoginPagePo.url);
  }

  username(): LabeledInputPo {
    return new LabeledInputPo(cy.getId('local-login-username'));
  }

  password(): PasswordPo {
    return new PasswordPo(cy.getId('local-login-password'));
  }

  canSubmit(): Cypress.Chainable<boolean> {
    return this.submitButton().isDisabled().then((isDisabled) => !isDisabled);
  }

  submit(): Cypress.Chainable {
    return this.submitButton().click();
  }

  switchToLocal(): Cypress.Chainable {
    const useLocal = this.useLocal();

    // TODO: We should have control over this instead of using a condition, as we want deterministic tests
    return useLocal ? useLocal.click() : cy;
  }

  useLocal() {
    return this.self().then(($page) => {
      const elements = $page.find('[data-testid="login-useLocal"]');

      return elements?.[0];
    });
  }

  submitButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="login-submit"]', this.self());
  }

  /**
   * Get login message
   * @returns
   */
  loginPageMessage() {
    return cy.getId('login__messages');
  }

  /**
   * Get login background image
   * @returns
   */
  loginBackgroundImage() {
    return cy.getId('login-landscape__img');
  }

  localSelector() {
    return cy.getId('locale-selector');
  }
}
