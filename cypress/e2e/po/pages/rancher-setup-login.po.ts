import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import FormPo from '@/cypress/e2e/po/components/form.po';
import PasswordPo from '@/cypress/e2e/po/components/password.po';

// Steve type for the aggregated ext self-user endpoint (mirrors EXT.SELFUSER in shell/config/types.js).
// Inlined deliberately: the `@shell/*` alias is NOT registered in the Cypress webpack preprocessor, so
// `import { EXT } from '@shell/config/types'` fails to resolve and breaks compilation of this spec across
// every CI config. Keeping the setup PO free of `@shell/*` imports means that trap can never recur.
const EXT_SELFUSER_TYPE = 'ext.cattle.io.selfuser';

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

    poll(`/v1/${ EXT_SELFUSER_TYPE }`, isRouted, retries, false);
    poll('/v1/management.cattle.io.users', isRouted, retries, false);
  }

  form(): FormPo {
    return new FormPo('form', this.self());
  }

  /**
   * Gate the UI login on the AUTHENTICATED post-login chain being ready — the real race the
   * anonymous probes in waitForBackendReady() cannot see (they even say so). loginLocal()
   * (shell/pages/auth/login.vue) authenticates and then, client-side, does
   * `POST /v1/ext.cattle.io.selfuser` + a mgmt-user GET BEFORE it router.push()es to
   * /auth/setup. On a cold backend the aggregated ext apiserver is not registered yet, that
   * POST 404s/5xxs, and loginLocal()'s catch SWALLOWS it — so the app never leaves /auth/login
   * and the setup page never mounts. That is exactly the two observed flakes:
   *   - 'expected .../auth/login to include .../auth/setup'
   *   - `@settingsReq` 2nd request "never occurred".
   * An anonymous probe can report the route as present (401/403) while the authenticated call
   * still fails, so this reproduces loginLocal()'s exact chain with a real session and polls
   * until it genuinely SERVES (2xx), then drops the probe session so the UI flow runs clean.
   *
   * All calls here are cy.request (issued by Cypress, not the app) so they are NOT captured by
   * any cy.intercept alias and cannot inflate the settings-request-count assertions. It runs
   * after the page's first (partial) settings fetch has already been asserted, and adds no
   * app-side settings request, so the "exactly 2 settings requests" expectation is preserved.
   * Relative URLs are used deliberately so the session/CSRF cookies land on the dashboard
   * origin — the same origin loginLocal() talks to — instead of a cross-origin API host.
   */
  private waitForAuthenticatedBackendReady(retries = 30) {
    const username = 'admin';
    const password = Cypress.env('bootstrapPassword');

    const is2xx = (resp: any) => resp.status >= 200 && resp.status < 300;

    const poll = (fn: () => Cypress.Chainable, test: (resp: any) => boolean, remaining: number): Cypress.Chainable => {
      return fn().then((resp: any) => {
        if (test(resp)) {
          return;
        }
        if (remaining <= 0) {
          throw new Error(`Authenticated backend not ready after retries (last status ${ resp.status })`);
        }
        cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting

        return poll(fn, test, remaining - 1);
      });
    };

    // 1. The first-run login itself must succeed. Body mirrors auth/login (shell/store/auth.js).
    poll(() => cy.request({
      url:                   '/v1-public/login',
      method:                'POST',
      failOnStatusCode:      false,
      retryOnNetworkFailure: true,
      body:                  {
        username,
        password,
        description:  'UI session',
        type:         'localProvider',
        responseType: 'cookie'
      },
    }), is2xx, retries);

    // 2. Reproduce loginLocal()'s post-auth chain authenticated, until it truly serves. This is
    //    the call that 404s on a cold ext apiserver and gets swallowed, stranding /auth/login.
    cy.getCookie('CSRF').then((csrf: any) => {
      const headers = csrf ? { 'x-api-csrf': csrf.value } : {};

      poll(() => cy.request({
        url:                   `/v1/${ EXT_SELFUSER_TYPE }`,
        method:                'POST',
        headers,
        body:                  {},
        failOnStatusCode:      false,
        retryOnNetworkFailure: true,
      }), is2xx, retries);
    });

    poll(() => cy.request({
      url:                   '/v1/management.cattle.io.users',
      failOnStatusCode:      false,
      retryOnNetworkFailure: true,
    }), is2xx, retries);

    // 3. Drop the probe session so the UI login runs the real first-run flow (unauthenticated
    //    -> login -> redirect). The backend registration warmed above persists server-side.
    cy.clearCookies();
  }

  bootstrapLogin() {
    // Close the authenticated cold-backend race BEFORE driving the UI: wait until the exact
    // post-login chain loginLocal() runs actually serves, so the swallowed-error path that
    // strands the app on /auth/login (and prevents the 2nd settings fetch) cannot happen.
    this.waitForAuthenticatedBackendReady();

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
    this.submitUntilRedirected();
  }

  /**
   * Submit the first-run login and confirm we actually LEAVE /auth/login before returning.
   *
   * loginLocal() (shell/pages/auth/login.vue) authenticates and then, still client-side,
   * POSTs `/v1/ext.cattle.io.selfuser`, GETs the management user and runs loadPlugins()
   * BEFORE it router.push()es to /auth/setup. On a cold backend any of those follow-up
   * calls can transiently fail, and loginLocal() SWALLOWS the error in its catch() — so we
   * are left on /auth/login with no redirect and, because the setup page never mounts, no
   * second (post-login) settings fetch. That is exactly the two observed flakes:
   *   - 'expected .../auth/login to include .../auth/setup'
   *   - `@settingsReq` 2nd request "never occurred".
   *
   * Anonymous backend-readiness probes (see waitForBackendReady) can report those endpoints
   * as routed while the AUTHENTICATED follow-up call still transiently fails, so gating alone
   * cannot close this race. Re-submitting re-runs the whole loginLocal() chain against the
   * now-warmer backend until it completes. A re-submit does NOT reload the page, so it fires
   * no additional `@settingsReq` and keeps the "exactly 2 settings requests" assertion intact
   * (the second settings fetch happens only once we finally reach /auth/setup).
   */
  private submitUntilRedirected(attempt = 0, settlePolls = 0) {
    const MAX_ATTEMPTS = 4;
    const SETTLE_POLLS = 12; // ~6s per attempt for the post-login chain + redirect to resolve

    if (settlePolls === 0) {
      this.submit();
    }

    cy.url().then((url) => {
      if (!url.includes('/auth/login')) {
        return; // redirected off the login page -> loginLocal() completed
      }

      if (settlePolls < SETTLE_POLLS) {
        cy.wait(500); // eslint-disable-line cypress/no-unnecessary-waiting

        return this.submitUntilRedirected(attempt, settlePolls + 1);
      }

      // Settle window elapsed and we're still on /auth/login: loginLocal() caught a transient
      // cold-backend error. Re-submit (bounded) against the warmer backend.
      if (attempt + 1 >= MAX_ATTEMPTS) {
        return; // exhausted; let the downstream waitForPage()/assertion surface a clear failure
      }

      return this.submitUntilRedirected(attempt + 1, 0);
    });
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
