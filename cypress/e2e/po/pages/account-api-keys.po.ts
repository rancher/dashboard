import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import ApiKeysListPo from '@/cypress/e2e/po/lists/account-api-keys-list.po';
import PasswordPo from '@/cypress/e2e/po/components/password.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';

export default class AccountPagePo extends PagePo {
  static url = '/account'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(AccountPagePo.url);
  }

  constructor() {
    super(AccountPagePo.url);
  }

  static navTo() {
    const userMenu = new UserMenuPo();

    userMenu.clickMenuItem('Account & API Keys');
  }

  waitForRequests() {
    AccountPagePo.goToAndWaitForGet(this.goTo.bind(this), ['/v3/tokens'], 10000);
  }

  title(): Cypress.Chainable {
    return this.self().get('h1').should('have.text', 'Account and API Keys');
  }

  createApiKeyButton() {
    return this.self().getId('account_create_api_keys');
  }

  changePasswordButton() {
    return this.self().getId('account_change_password');
  }

  create(): Cypress.Chainable {
    return this.createApiKeyButton().click();
  }

  changePassword(): Cypress.Chainable {
    return this.changePasswordButton().click();
  }

  list(): ApiKeysListPo {
    return new ApiKeysListPo('[data-testid="api_keys_list"]');
  }

  applyButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }

  apply(): Cypress.Chainable {
    return this.applyButton().click();
  }

  cancel(): Cypress.Chainable {
    return this.self().get('button[type="reset"]').click();
  }

  changePasswordModal() {
    return cy.getId('change-password__modal');
  }

  currentPassword(): PasswordPo {
    return new PasswordPo('[data-testid="account__current_password"]');
  }

  newPassword(): PasswordPo {
    return new PasswordPo('[data-testid="account__new_password"]');
  }

  confirmPassword(): PasswordPo {
    return new PasswordPo('[data-testid="account__confirm_password"]');
  }

  /**
   * Convenience method
   */
  sortableTable() {
    return this.list().resourceTable().sortableTable();
  }
}
