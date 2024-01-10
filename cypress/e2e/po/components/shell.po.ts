import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class Shell extends ComponentPo {
  constructor() {
    super('#windowmanager');
  }

  readonly terminalRow: string = '.xterm-rows'

  openTerminal() {
    // get and click on the first row's action menu button
    cy.get(`button[data-testid="sortable-table-0-action-button"]`).first().click();
    // get and click on the action menu's first option (execute shell)
    cy.get(`li[data-testid="action-menu-0-item"]`).click();
    this.self().get('.window.show-grid .text-success').should('contain', 'Connected');

    return this;
  }

  closeTerminal() {
    return this.self().get('.tab .closer').click();
  }

  terminalStatus(label: string) {
    return this.self().get('.status').contains(label);
  }
}
