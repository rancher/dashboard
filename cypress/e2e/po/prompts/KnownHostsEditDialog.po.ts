import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class KnownHostsEditDialogPo extends ComponentPo {
  constructor() {
    super(cy.getId('sshKnownHostsDialog'));
  }

  set(value: string): Cypress.Chainable {
    return this.self().get('[data-testid="ssh-known-hosts-dialog_code-mirror"]').type(value);
  }

  save() {
    return this.self().get('[data-testid="ssh-known-hosts-dialog_save-btn"]').click({ force: true });
  }
}
