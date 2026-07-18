import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import FormPo from '@/cypress/e2e/po/components/form.po';
import PasswordPo from '@/cypress/e2e/po/components/password.po';
import { EXT } from '@shell/config/types';

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
   * count assertions (the polls also omit the `?exclude=metadata.managedFields` query the
   * settingsReq alias matches on, so they can never inflate that count).
   *
   * The gate covers the WHOLE chain loginLocal() drives, not just the login POST:
   *  1. `/v1-public/authproviders` served with the `local` provider — the login page's fetch()
   *     needs it to render the local login form.
   *  2. Steve serving `management.cattle.io.settings` with `first-login === 'true'` — proves the
   *     Steve settings schema is loaded and the instance is still first-run, so both the login
   *     redirect and setup.vue's beforeCreate guard resolve first-login and target /auth/setup.
   *  3. The aggregated ext API (`/v1/ext.cattle.io.selfuser`) and the management users
   *     collection (`/v1/management.cattle.io.users`) are ROUTED. This is the gap the earlier
   *     iterations missed: loginLocal() authenticates (login POST -> 200) and then immediately
   *     does `POST /v1/ext.cattle.io.selfuser` + `GET /v1/management.cattle.io.users/{id}`. On a
   *     cold backend the aggregated ext apiserver is not registered yet, that POST 404s/5xxs and
   *     throws into loginLocal()'s catch, so the app never leaves /auth/login — which is exactly
   *     the observed failures (no /auth/setup redirect AND the 2nd settings request never fires).
   *     A routed endpoint answers the unauthenticated probe with 401 (or 403/405); an
   *     unregistered/cold one 404s or 5xxs. We gate best-effort (never throw) since a hardened
   *     backend could legitimately 404 an anonymous probe of an authenticated type — the point is
   *     to give a cold backend time to finish routing, not to add a new hard failure.
   */
  waitForBackendReady(retries = 30) {
    const api = Cypress.env('api') || '';

    const poll = (url: string, test: (resp: any) => boolean, remaining: number, fatal = true): Cypress.Chainable => {
      return cy.request({
        url:                   `${ api }${ url }`,
        failOnStatusCode:      false,
        retryOnNetworkFailure: true,
      }).then((resp: any) => {
        if (test(resp)) {
          return;
        }

        if (remaining <= 0) {
          if (fatal) {
            throw new Error(`Backend not ready after retries: ${ url } (last status ${ resp.status })`);
          }

          // Best-effort probe exhausted: proceed and let the UI step surface any real failure.
          return;
        }

        cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting

        return poll(url, test, remaining - 1, fatal);
      });
    };

    poll('/v1-public/authproviders', (resp) => resp.status === 200 && (resp.body?.data || []).some((p: any) => p.id === 'local'), retries);
    poll('/v1/management.cattle.io.settings', (resp) => {
      const firstLogin = resp.status === 200 && (resp.body?.data || []).find((s: any) => s.id === 'first-login');

      return firstLogin?.value === 'true';
    }, retries);

    // Endpoint is routed (backend serving it) once it answers with anything other than a
    // not-found / server-error / network failure — 401/403/405 all prove the route exists.
    const isRouted = (resp: any) => resp.status !== 0 && resp.status !== 404 && resp.status < 500;

    poll(`/v1/${ EXT.SELFUSER }`, isRouted, retries, false);
    poll('/v1/management.cattle.io.users', isRouted, retries, false);
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
