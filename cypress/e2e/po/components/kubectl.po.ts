import ComponentPo, { GetOptions } from '@/cypress/e2e/po/components/component.po';
import jsyaml from 'js-yaml';

export default class Kubectl extends ComponentPo {
  constructor() {
    super('#windowmanager');
  }

  readonly kubeCommand: string = 'kubectl'
  readonly terminalRow: string = '.xterm-link-layer'

  openTerminal(options?: GetOptions) {
    cy.get('#btn-kubectl').click();
    this.self().get('.window.show-grid .text-success', options).should('contain', 'Connected');

    return this;
  }

  closeTerminal() {
    this.self().get('[data-testid="wm-tab-close-button"]').click();
  }

  waitForTerminalToBeVisible() {
    this.self().get('[data-testid="wm-tab-close-button"]').should('be.visible');
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

  executeMultilineCommand(jsonObject: Object, wait = 3000) {
    this.self()
      .get(this.terminalRow)
      .type(`kubectl apply -f - <<EOF{enter}`)
      .type(`${ jsyaml.dump(jsonObject) }{enter}`)
      .type(`EOF{enter}`)
      .wait(wait);

    return this;
  }

  openAndExecuteCommand(command: string, wait = 3000) {
    this.openTerminal();
    this.executeCommand(command, wait);

    return this;
  }

  openAndExecuteMultilineCommand(jsonObject: Object, wait = 3000) {
    this.openTerminal();
    this.executeMultilineCommand(jsonObject, wait);

    return this;
  }
}
