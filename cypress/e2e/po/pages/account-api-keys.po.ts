import PagePo from '~/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import ApiKeysListPo from '@/cypress/e2e/po/lists/account-api-keys-list.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

export default class AccountPagePo extends PagePo {
  static url: string = '/account'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(AccountPagePo.url);
  }

  constructor() {
    super(AccountPagePo.url);
  }

  title(): Cypress.Chainable {
    return this.self().get('h1').should('have.text', 'Account and API Keys');
  }

  private createApiKeyButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="account_create_api_keys"]', this.self());
  }

  private changePasswordButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="account_change_password"]', this.self());
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

  currentPassword(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Current Password');
  }

  newPassword(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'New Password');
  }

  confirmPassword(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Confirm Password');
  }
}
