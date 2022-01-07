import PagePo from '@/cypress/integration/po/pages/page.po';
import LabeledInputPo from '@/cypress/integration/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/integration/po/components/async-button.po';
import FormPo from '@/cypress/integration/po/components/form.po';

export class LoginPagePo extends PagePo {
  static url: string = '/auth/login'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(LoginPagePo.url);
  }

  form: FormPo;

  constructor() {
    super(LoginPagePo.url);

    this.form = new FormPo('form', this.self());
  }

  username(): LabeledInputPo {
    return new LabeledInputPo(this.form.labels().first());
  }

  password(): LabeledInputPo {
    return new LabeledInputPo(this.form.labels().eq(1));
  }

  canSubmit(): Cypress.Chainable<boolean> {
    return this.submitButton().isDisabled().then(isDisabled => !isDisabled);
  }

  submit(): Cypress.Chainable {
    return this.submitButton().click();
  }

  switchToLocal(): Cypress.Chainable {
    const useLocal = this.useLocal();

    return useLocal ? useLocal.click() : cy;
  }

  useLocal() {
    return this.self().then(($page) => {
      const elements = $page.find('#login-useLocal');

      return elements?.[0];
    });
  }

  private submitButton(): AsyncButtonPo {
    return new AsyncButtonPo('button.role-primary', this.self());
  }
}
