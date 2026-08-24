import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import PasswordPo from '@/cypress/e2e/po/components/password.po';
import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { MEDIUM_TIMEOUT_OPT } from '~/cypress/support/utils/timeouts';

export class LoginPagePo extends PagePo {
  static url = '/auth/login';
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

  confirmationAcceptButton(): ComponentPo {
    return new ComponentPo('[data-testid="login-confirmation-accept-button"]', this.self());
  }

  /**
   * Selectors that indicate the login page has rendered past its loading spinner. Kept in sync with
   * the accessors above/below: welcomeMessage (.login-welcome), username, useLocal and
   * confirmationAcceptButton.
   */
  static readonly FORM_READY_SELECTOR = [
    '.login-welcome',
    '[data-testid="local-login-username"]',
    '[data-testid="login-useLocal"]',
    '[data-testid="login-confirmation-accept-button"]',
  ].join(', ');

  /**
   * [CREATE ISSUE TO INVESTIGATE] The login page's async fetch (shell/pages/auth/login.vue) awaits
   * settings/auth-provider requests with no timeout or retry and shows a <Loading> spinner while
   * pending; if one of those requests hangs the page spins forever and the login form never renders.
   * The app should time out / retry / surface an error rather than spinning indefinitely.
   *
   * Guard the shared login flow against that hang WITHOUT changing the happy path: poll for the login
   * page to render past the spinner and, only if it never does within a normal load window (~10s),
   * reload to re-fire the fetch. When the page loads normally this returns as soon as the form is
   * present and the caller's flow runs unchanged. Uses DOM inspection (not a retrying assertion) so a
   * missing form triggers recovery instead of failing the command.
   */
  ensureFormReady(poll = 0, reloads = 0): void {
    cy.get('body').then(($body) => {
      const rendered = $body.find(LoginPagePo.FORM_READY_SELECTOR).length > 0;

      if (rendered) {
        return; // page rendered past the spinner - proceed with the normal flow
      }

      if (poll < 20) {
        // Still within a normal load window (~10s) - wait and re-check without reloading.
        cy.wait(500); // eslint-disable-line cypress/no-unnecessary-waiting

        return this.ensureFormReady(poll + 1, reloads);
      }

      if (reloads < 2) {
        // Genuinely stuck on the spinner - reload to re-fire the login page's fetch.
        cy.reload();

        return this.ensureFormReady(0, reloads + 1);
      }
      // Give up recovering; the caller's assertions surface the real failure.
    });
  }

  welcomeMessage() {
    return this.self(MEDIUM_TIMEOUT_OPT).find('.login-welcome');
  }

  isWelcomeMessage(vendor = 'Rancher') {
    return this.welcomeMessage().contains(`Welcome to ${ vendor }`).should('be.visible');
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
