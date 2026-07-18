import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import FormPo from '@/cypress/e2e/po/components/form.po';
import PasswordPo from '@/cypress/e2e/po/components/password.po';

export class RancherSetupLoginPagePo extends PagePo {
  static url = '/auth/login'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(RancherSetupLoginPagePo.url);
  }

  constructor() {
    super(RancherSetupLoginPagePo.url);
  }

  form(): FormPo {
    return new FormPo('form', this.self());
  }

  bootstrapLogin() {
    // Gate the submit on the login page having finished loading its first-run state.
    // The post-login redirect to /auth/setup only happens when the page's `firstLogin`
    // flag is true, which is set asynchronously in fetch() from the FIRST_LOGIN setting.
    // The first-login message renders only once `firstLogin === true`, so its visibility
    // is a deterministic readiness signal (Cypress retries `should('be.visible')`).
    // Submitting before this races a cold backend and sends the user to /home instead of
    // /auth/setup, so the setup page never mounts and its settings request never fires.
    this.hasInfoMessage();
    this.canSubmit().should('eq', true);
    this.password().set(Cypress.env('bootstrapPassword'));
    this.canSubmit().should('eq', true);
    this.submit();
  }

  hasInfoMessage() {
    this.self().getId('first-login-message').should('be.visible');
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

  private submitButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="login-submit"]', this.self());
  }
}
