import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class Shell extends ComponentPo {
  constructor() {
    super('#horizontal-window-manager');
  }

  openTerminal() {
    // get and click on the first row's action menu button
    cy.get(`[data-testid="sortable-table-0-action-button"`).first().click();
    // get and click on the action menu's first option (execute shell)
    cy.get(`[dropdown-menu-item]`).contains('Execute Shell').click();
    this.self().find('.window.show-grid .text-success').should('contain', 'Connected');

    return this;
  }

  closeTerminal() {
    return this.self().find('.tab .closer').click();
  }

  terminalStatus(label: string) {
    return this.self().find('.status').contains(label);
  }

  /**
   * The "Container: <name>" picker shown by the log and shell windows for a
   * multi-container pod.
   */
  containerPicker() {
    return this.self().find('.containerPicker').first();
  }

  /**
   * The Follow / Clear / Download group that sits immediately right of the
   * picker in the log window.
   */
  logActionGroup() {
    return this.self().find('[data-testid="log-action-buttons"]');
  }

  /**
   * The connection status ("Connected" / "Disconnected") at the end of the bar.
   */
  connectionStatus() {
    return this.self().find('.status').first();
  }
}
