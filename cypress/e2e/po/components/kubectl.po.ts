import ComponentPo from '@/cypress/e2e/po/components/component.po';
import jsyaml from 'js-yaml';

export default class Kubectl extends ComponentPo {
  constructor() {
    super('#windowmanager');
  }

  readonly kubeCommand: string = 'kubectl'
  readonly terminalRow: string = '.xterm-link-layer'

  openTerminal() {
    cy.get('#btn-kubectl').click();
    this.self().get('.window.show-grid .text-success').should('contain', 'Connected');

    return this;
  }

  closeTerminal() {
    this.self().get('[data-testid="wm-tab-close-button"]').click();
  }

  /**
   * Charts like Monitoring have a long helm install. helm has a timeout of 10m for this reason.
   * Example helm output: beginning wait for 181 resources with timeout of 10m0s
   *
   * This will wait 50% of the default helm timeout during install. When the helm command exit on fail or success
   * the terminal gets disconnected immediately then other charts continue regularly without waiting 10m
   * @returns
   */
  checkChartInstallExitOnTerminal() {
    cy.get('.logs-container').should('be.visible');
    cy.get('.logs-container', { timeout: 120000 }).should('contain', 'SUCCESS');
    this.self().get('.text-error', { timeout: 240000 }).should('contain', 'Disconnected');
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
