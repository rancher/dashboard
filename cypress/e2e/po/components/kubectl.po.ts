import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class Kubectl extends ComponentPo {
  constructor() {
    super('[data-testid="windowmanager"]');
  }

  readonly kubeCommand: string = 'kubectl'
  readonly terminalRow: string = '.xterm-rows'

  openTerminal() {
    cy.get('[data-testid="btn-kubectl"]').click();
    this.self().get('.window.show-grid .text-success').should('contain', 'Connected');
  }

  /**
   *
   * @param command Kube command without the 'kubectl'
   * @returns executeCommand for method chanining
   */
  executeCommand(command: string, wait = 3000) {
    this.self().get(this.terminalRow).type(`${ this.kubeCommand } ${ command }{enter}`);
    cy.wait(wait);

    return this;
  }
}
