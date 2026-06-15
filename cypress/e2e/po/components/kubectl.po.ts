import ComponentPo, { GetOptions } from '@/cypress/e2e/po/components/component.po';
import jsyaml from 'js-yaml';

export default class Kubectl extends ComponentPo {
  constructor() {
    super('#horizontal-window-manager');
  }

  readonly kubeCommand: string = 'kubectl'

  openTerminal(options?: GetOptions) {
    cy.get('#btn-kubectl').click();
    this.waitForTerminalStatus('Connected', options);

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
    // The textarea is the actual input element for xterm.js, and is present for both
    // DOM and WebGL renderers. We target the one in the active window to avoid ambiguity.
    return this.self().find('.xterm-helper-textarea');
  }

  /**
   *
   * @param command Kube command without the 'kubectl'
   * @returns executeCommand for method chanining
   */
  executeCommand(command: string, wait = 3000) {
    this.terminalRow().type(`${ this.kubeCommand } ${ command }{enter}`);
    cy.wait(wait);

    return this;
  }

  executeMultilineCommand(jsonObject: Object, wait = 3000) {
    this.terminalRow()
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
