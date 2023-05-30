import ComponentPo from '@/cypress/e2e/po/components/component.po';
import jsyaml from 'js-yaml';

export default class Kubectl extends ComponentPo {
  constructor() {
    super('[data-testid="windowmanager"]');
  }

  readonly kubeCommand: string = 'kubectl'
  readonly terminalRow: string = '.xterm-rows'

  openTerminal() {
    cy.get('#btn-kubectl').click();
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

  executeMultilineCommand(jsonObject: Object, wait = 3000) {
    this.self()
      .get(this.terminalRow)
      .type(`kubectl apply -f - <<EOF{enter}`)
      .type(`${ jsyaml.dump(jsonObject) }{enter}`)
      .type(`EOF{enter}`)
      .wait(wait);

    return this;
  }
}
