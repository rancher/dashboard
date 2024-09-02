import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
export default class CreateKeyPagePo extends PagePo {
  static url = '/account/create-key'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(CreateKeyPagePo.url);
  }

  constructor() {
    super(CreateKeyPagePo.url);
  }

  title(): Cypress.Chainable {
    return this.self().get('h1').should('include.text', 'API Key:');
  }

  description(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Description');
  }

  expiryOptions(): RadioGroupInputPo {
    return new RadioGroupInputPo('[data-testid="expiry__options"]');
  }

  createButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }

  doneButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="token_done_create_button"]', this.self());
  }

  apiAccessKey() {
    return cy.getId('detail-top_html').first();
  }

  done(): Cypress.Chainable {
    return this.doneButton().click();
  }

  create(): Cypress.Chainable {
    return this.createButton().click();
  }
}
