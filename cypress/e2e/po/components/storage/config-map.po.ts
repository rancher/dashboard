import CreateEditViewPo from '@/cypress/e2e/po/components/create-edit-view.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import InputPo from '@/cypress/e2e/po/components/input.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';

export default class ConfigMapPo extends CreateEditViewPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  nameInput() {
    return LabeledInputPo.bySelector(this.self(), '[data-testid="name-ns-description-name"]');
  }

  keyInput() {
    return InputPo.bySelector(this.self(), '[data-testid="input-kv-item-key-0"]');
  }

  valueInput() {
    return CodeMirrorPo.bySelector(this.self(), '[data-testid="code-mirror-multiline-field"]');
  }

  descriptionInput() {
    return LabeledInputPo.byLabel(this.self(), 'Description');
  }

  errorBanner() {
    return cy.get('#cru-errors');
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }
}
