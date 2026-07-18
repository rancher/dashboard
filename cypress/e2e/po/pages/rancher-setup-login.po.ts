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

  /**
   * Visit the login page, but only once the backend is actually serving the first-run
   * state the page depends on. The gate MUST run before the visit because the page's
   * fetch() reads first-login/auth-providers exactly once on mount; if we drive the UI
   * against a cold backend the redirect to /auth/setup never happens (see bootstrapLogin).
   */
  goTo(params?: string, fragment?: string): Cypress.Chainable<Cypress.AUTWindow> {
    this.waitForBackendReady();

    return super.goTo(params, fragment);
  }

  /**
   * Poll real backend-readiness signals (retry-able cy.request, not a fixed timer) before
   * driving the first-run UI. cy.request is issued by Cypress itself, not the app, so these
   * polls are NOT captured by any cy.intercept alias and do not affect the settings-request
   * count assertions.
   *
   * Two signals gate readiness, matching what the login flow needs:
   *  - `/v1-public/authproviders` served with the `local` provider — the login page's fetch()
   *    needs it to render the local login form.
   *  - Steve serving `management.cattle.io.settings` with `first-login === 'true'` — this both
   *    proves the Steve schemas are loaded (so loginLocal()'s downstream selfuser POST / users
   *    GET won't 500 and throw us back to /auth/login) and that the instance is still in its
   *    first-run state, so the post-login redirect targets /auth/setup.
   */
  waitForBackendReady(retries = 30) {
    const api = Cypress.env('api') || '';

    const poll = (url: string, test: (resp: any) => boolean, remaining: number): Cypress.Chainable => {
      return cy.request({
        url:                   `${ api }${ url }`,
        failOnStatusCode:      false,
        retryOnNetworkFailure: true,
      }).then((resp: any) => {
        if (resp.status === 200 && test(resp)) {
          return;
        }

        if (remaining <= 0) {
          throw new Error(`Backend not ready after retries: ${ url } (last status ${ resp.status })`);
        }

        cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting

        return poll(url, test, remaining - 1);
      });
    };

    poll('/v1-public/authproviders', (resp) => (resp.body?.data || []).some((p: any) => p.id === 'local'), retries);
    poll('/v1/management.cattle.io.settings', (resp) => {
      const firstLogin = (resp.body?.data || []).find((s: any) => s.id === 'first-login');

      return firstLogin?.value === 'true';
    }, retries);
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
    // Backend readiness is gated up-front in goTo(); this asserts the page reflects it.
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
