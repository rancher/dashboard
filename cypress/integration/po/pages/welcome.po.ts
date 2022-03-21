import PagePo from '@/cypress/integration/po/pages/page.po';
import LabeledInputPo from '@/cypress/integration/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/integration/po/components/async-button.po';
import FormPo from '@/cypress/integration/po/components/form.po';

export class WelcomePagePo extends PagePo {
  static url: string = '/auth/login'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(WelcomePagePo.url);
  }

  form: FormPo;

  constructor() {
    super(WelcomePagePo.url);

    this.form = new FormPo('form', this.self());
  }

  password(): LabeledInputPo {
    return new LabeledInputPo(this.form.labels().first());
  }

  canSubmit(): Cypress.Chainable<boolean> {
    return this.submitButton().isDisabled().then(isDisabled => !isDisabled);
  }

  submit(): Cypress.Chainable {
    return this.submitButton().click();
  }

  private submitButton(): AsyncButtonPo {
    return new AsyncButtonPo('#submit', this.self());
  }
}
