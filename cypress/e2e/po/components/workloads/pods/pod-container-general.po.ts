import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import ComponentPo from '@/cypress/e2e/po/components/component.po';

export class PodContainerGeneral extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  inputImageName() {
    return new LabeledInputPo(cy.get('[placeholder="e.g. nginx:latest"]'));
  }

  createButton() {
    return this.self().find('[data-testid="form-save"]');
  }
}
