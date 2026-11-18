import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import PasswordPo from '@/cypress/e2e/po/components/password.po';
import ComponentPo from '@/cypress/e2e/po/components/component.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
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
    // TODO: We should have control over this instead of using a condition, as we want deterministic tests
    return this.self().then(($page) => {
      if ($page.find(LoginPagePo.LOCAL_USERNAME_SELECTOR).length) {
        return;
      }

      if ($page.find(LoginPagePo.USE_LOCAL_SELECTOR).length) {
        cy.get(LoginPagePo.USE_LOCAL_SELECTOR).first().click();
      } else if ($page.find(LoginPagePo.CHOOSE_PROVIDER_SELECTOR).length) {
        // A collapsed list keeps local behind its link
        this.openProviderList();
        cy.get(LoginPagePo.LOCAL_OPTION_SELECTOR).click();
      }
    });
  }

  submitButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="login-submit"]', this.self());
  }

  /**
   * The primary "Log in with <provider>" button for the currently selected
   * auth provider.
   */
  providerSubmitButton(): ComponentPo {
    return new ComponentPo('[data-testid="login-provider-submit"]', this.self());
  }

  /**
   * The list of providers. Offered once there are several external providers to
   * choose between, and shown in place of the login once the user asks for a
   * different provider; a single one alongside local is offered as a link
   * instead.
   */
  providerList(): ComponentPo {
    return new ComponentPo('[data-testid="login-provider-list"]');
  }

  /**
   * The scrolling part of the list, which holds the external providers. Local
   * sits outside it so that it is always in reach.
   */
  providerScrollList(): ComponentPo {
    return new ComponentPo('[data-testid="login-provider-scroll"]');
  }

  /**
   * A provider in the list, keyed by its authconfig name.
   */
  providerOption(id: string): ComponentPo {
    return new ComponentPo(`[data-testid="login-provider-option-${ id }"]`);
  }

  selectProvider(id: string): Cypress.Chainable {
    return this.providerOption(id).self().click();
  }

  /**
   * The link off the login on screen: to the list where there is one, or
   * straight to the single external provider where there is not.
   */
  chooseDifferentProvider(): ComponentPo {
    return new ComponentPo(LoginPagePo.CHOOSE_PROVIDER_SELECTOR);
  }

  openProviderList(): Cypress.Chainable {
    return this.chooseDifferentProvider().self().click();
  }

  rememberProviderCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="login-provider-remember"]');
  }

  confirmationAcceptButton(): ComponentPo {
    return new ComponentPo('[data-testid="login-confirmation-accept-button"]', this.self());
  }

  static readonly LOCAL_USERNAME_SELECTOR = '[data-testid="local-login-username"]';

  static readonly CHOOSE_PROVIDER_SELECTOR = '[data-testid="login-provider-choose"]';

  static readonly LOCAL_OPTION_SELECTOR = '[data-testid="login-provider-option-local"]';

  /**
   * The way through to the local form, wherever the page has put it: a card in
   * the provider list, or a link where a single external provider makes a list
   * of two unnecessary.
   */
  static readonly USE_LOCAL_SELECTOR = [
    LoginPagePo.LOCAL_OPTION_SELECTOR,
    '[data-testid="login-useLocal"]',
  ].join(', ');

  /**
   * Selectors that indicate the login page has rendered past its loading spinner. Kept in sync with
   * the accessors above/below: welcomeMessage (.login-welcome), username, the ways through to local,
   * chooseDifferentProvider and confirmationAcceptButton.
   */
  static readonly FORM_READY_SELECTOR = [
    '.login-welcome',
    LoginPagePo.LOCAL_USERNAME_SELECTOR,
    LoginPagePo.USE_LOCAL_SELECTOR,
    LoginPagePo.CHOOSE_PROVIDER_SELECTOR,
    '[data-testid="login-confirmation-accept-button"]',
  ].join(', ');

  /**
   * Known issue rancher/dashboard#19320: the login page's async fetch (shell/pages/auth/login.vue) awaits
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

  isWelcomeMessage(vendor = 'Rancher', expectedMessage = `Welcome to ${ vendor }`) {
    return this.welcomeMessage().contains(expectedMessage).should('be.visible');
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

  localeMenuItems() {
    return cy.get('[dropdown-menu-item][lang]');
  }
}
