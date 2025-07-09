import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import ComponentPo from '@/cypress/e2e/po/components/component.po';

export class PodContainerResources extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  clickResources() {
    return this.self().get('[data-testid="btn-resources"]').first()
      .scrollIntoView()
      .click();
  }

  inputCpuReservation() {
    return new LabeledInputPo(cy.get('[data-testid="cpu-reservation"]'));
  }

  inputMemoryReservation() {
    return new LabeledInputPo(cy.get('[data-testid="memory-reservation"]'));
  }

  inputCpuLimit() {
    return new LabeledInputPo(cy.get('[data-testid="cpu-limit"]'));
  }

  inputMemoryLimit() {
    return new LabeledInputPo(cy.get('[data-testid="memory-limit"]'));
  }

  inputGpuLimit() {
    return new LabeledInputPo(cy.get('[data-testid="gpu-limit"]'));
  }
}
