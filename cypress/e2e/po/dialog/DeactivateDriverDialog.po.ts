import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class PromptRemove extends ComponentPo {
  deactivate() {
    return cy.getId('deactivate-driver-confirm').click();
  }
}
