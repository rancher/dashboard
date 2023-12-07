import PagePo from '@/cypress/e2e/po/pages/page.po';
import MachinesCreateEditPo from '@/cypress/e2e/po/edit/machines.po';
import MachinesListPo from '@/cypress/e2e/po/lists/machines-list.po';
import YamlEditor from '@/cypress/e2e/po/components/yaml-editor.po';

export default class MachinesPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/cluster.x-k8s.io.machine`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(MachinesPagePo.createPath(clusterId));
  }

  constructor(private clusterId = 'local') {
    super(MachinesPagePo.createPath(clusterId));
  }

  create() {
    return this.self().find('[data-testid="masthead-create-yaml"]').click();
  }

  createEditMachines(nsName?: string, machineName?: string): MachinesCreateEditPo {
    return new MachinesCreateEditPo(this.clusterId, nsName, machineName);
  }

  list(): MachinesListPo {
    return new MachinesListPo('[data-testid="cluster-list-container"]');
  }

  yamlEditor(): YamlEditor {
    return new YamlEditor();
  }
}
