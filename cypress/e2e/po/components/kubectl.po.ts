import ComponentPo, { GetOptions } from '@/cypress/e2e/po/components/component.po';
import jsyaml from 'js-yaml';

export default class Kubectl extends ComponentPo {
  constructor() {
    super('#horizontal-window-manager');
  }

  readonly kubeCommand: string = 'kubectl';

  openTerminal(options?: GetOptions) {
    cy.get('#btn-kubectl').click();
    this.waitForTerminalStatus('Connected', options);

    return this;
  }

  closeTerminal() {
    this.self().get('[data-testid="wm-tab-close-button"]').first().click();
  }

  /**
   * Close the terminal only if it is actually open. After some flows (e.g. a chart install) the
   * window-manager terminal (#horizontal-window-manager) opens with Helm output, but its open/close
   * timing varies and it can be absent - never opened, or already closed - by the time we look.
   * Closing it unconditionally flakes with "#horizontal-window-manager not found"; a missing terminal
   * just means there is nothing to close.
   */
  closeTerminalIfOpen() {
    cy.get('body').then(($body) => {
      if ($body.find('#horizontal-window-manager').length > 0) {
        this.closeTerminal();
      }
    });
  }

  closeTerminalByTabName(name: string) {
    return this.self().get(`[aria-label="${ name }"] [data-testid="wm-tab-close-button"]`).click();
  }

  waitForTerminalToBeVisible() {
    this.self().get('[data-testid="wm-tab-close-button"]').should('be.visible');
  }

  waitForTerminalStatus(status: 'Connected' | 'Disconnected', options?: GetOptions) {
    // the window manager itself is rendered when the terminal opens, so it needs the same
    // timeout as the status text
    this.self(options).contains('.active .status', status, options);
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

  /**
   * Run a command in the shell verbatim, without the 'kubectl' prefix. Use for anything else
   * available in the shell pod - helm, curl, etc
   * @param command full command to type, eg 'helm repo add ...'
   * @returns executeShellCommand for method chaining
   */
  executeShellCommand(command: string, wait = 3000) {
    this.terminalRow().type(`${ command }{enter}`);
    cy.wait(wait);

    return this;
  }

  /**
   * Assert that some text appears in the terminal output. Long-running commands (helm install,
   * for instance) need a generous timeout rather than a fixed wait
   * @param text text to look for in the terminal output
   */
  waitForOutput(text: string, timeout = 300000) {
    this.self().contains(text, { timeout }).should('exist');

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
