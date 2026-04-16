import ComponentPo, { GetOptions } from '@/cypress/e2e/po/components/component.po';
import jsyaml from 'js-yaml';

export default class Kubectl extends ComponentPo {
  constructor() {
    super('#horizontal-window-manager');
  }

  readonly kubeCommand: string = 'kubectl'

  openTerminal(options?: GetOptions) {
    cy.get('#btn-kubectl').click();
    this.self().get('.window.show-grid .text-success', options).should('contain', 'Connected');

    return this;
  }

  closeTerminal() {
    this.self().get('[data-testid="wm-tab-close-button"]').first().click();
  }

  closeTerminalByTabName(name: string) {
    return this.self().get(`[aria-label="${ name }"] [data-testid="wm-tab-close-button"]`).click();
  }

  waitForTerminalToBeVisible() {
    this.self().get('[data-testid="wm-tab-close-button"]').should('be.visible');
  }

  waitForTerminalStatus(status: 'Connected' | 'Disconnected', options?: GetOptions) {
    this.self().contains('.active .status', status, options);
  }

  terminalRow() {
    // .xterm-helper-textarea is always present regardless of rendering mode (DOM, canvas, WebGL)
    return this.self().find('.xterm-helper-textarea');
  }

  /**
   *
   * @param command Kube command without the 'kubectl'
   * @returns executeCommand for method chanining
   */
  executeCommand(command: string, wait = 3000) {
    this.terminalRow().type(`${ this.kubeCommand } ${ command }{enter}`, { force: true });
    cy.wait(wait);

    return this;
  }

  executeMultilineCommand(jsonObject: Object, wait = 3000) {
    this.terminalRow()
      .type(`kubectl apply -f - <<EOF{enter}`, { force: true })
      .type(`${ jsyaml.dump(jsonObject) }{enter}`, { force: true })
      .type(`EOF{enter}`, { force: true })
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
