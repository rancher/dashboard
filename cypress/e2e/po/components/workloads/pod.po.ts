import CreateEditViewPo from '@/cypress/e2e/po/components/create-edit-view.po';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import Shell from '@/cypress/e2e/po/components/shell.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';

export default class PodPo extends CreateEditViewPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  createPodViaKubectl(podYaml: { [key: string]: any }, wait = 6000) {
    const terminal = new Kubectl();

    terminal.openTerminal();

    // No console request for this one
    terminal.executeMultilineCommand(podYaml, wait);
  }

  openPodShell() {
    const shell = new Shell();

    shell.openTerminal();
  }
}
