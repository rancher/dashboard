import PagePo from '@/cypress/integration/po/pages/page.po';
import LabeledInputPo from '@/cypress/integration/po/components/labeled-input.po';
import CheckboxInputPo from '@/cypress/integration/po/components/checkbox-input.po';
import RadioGroupInputPo from '@/cypress/integration/po/components/radio-group-input.po';
import AsyncButtonPo from '@/cypress/integration/po/components/async-button.po';
import FormPo from '@/cypress/integration/po/components/form.po';

export class RancherSetupAuthVerifyPage extends PagePo {
  static url: string = '/auth/login'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(RancherSetupAuthVerifyPage.url);
  }

  form: FormPo;

  constructor() {
    super(RancherSetupAuthVerifyPage.url);

    this.form = new FormPo('form', this.self());
  }

  choosePassword(): RadioGroupInputPo {
    return new RadioGroupInputPo(this.form.radioGroups().eq(0));
  }

  password(): LabeledInputPo {
    return new LabeledInputPo(this.form.labels().first());
  }

  confirmPassword(): LabeledInputPo {
    return new LabeledInputPo(this.form.labels().eq(1));
  }

  serverUrl(): LabeledInputPo {
    return new LabeledInputPo(this.form.labels().eq(1));
  }

  termsAgreement(): CheckboxInputPo {
    return new CheckboxInputPo(this.form.checkboxes().eq(1));
  }

  canSubmit(): Cypress.Chainable<boolean> {
    return this.submitButton().isDisabled().then(isDisabled => !isDisabled);
  }

  submit(): Cypress.Chainable {
    return this.submitButton().click();
  }

  private submitButton(): AsyncButtonPo {
    return new AsyncButtonPo('button.role-primary', this.self());
  }
}
