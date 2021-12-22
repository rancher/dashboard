import Page from '@/cypress/integration/po/pages/page.po';
import LabeledInputPo from '@/cypress/integration/po/components/labeled-input.po';
import AsyncButtonPO from '@/cypress/integration/po/components/async-button.po';

export class LoginPagePo extends Page {
  static url: string = '/auth/login'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(LoginPagePo.url);
  }

  constructor() {
    super(LoginPagePo.url);
  }

  username(): LabeledInputPo {
    return new LabeledInputPo(this.labels().first());
  }

  password(): LabeledInputPo {
    return new LabeledInputPo(this.labels().eq(1));
  }

  private labels(): Cypress.Chainable {
    return this.self().find('.labeled-input');
  }

  canSubmit(): Cypress.Chainable<boolean> {
    return this.submitButton().isDisabled().then(isDisabled => !isDisabled);
  }

  submit(): Cypress.Chainable {
    return this.submitButton().click();
  }

  private submitButton(): AsyncButtonPO {
    return new AsyncButtonPO('button.role-primary', this.self());
  }
}
