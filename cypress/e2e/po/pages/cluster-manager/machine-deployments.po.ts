import PagePo from '@/cypress/e2e/po/pages/page.po';
import YamlEditor from '@/cypress/e2e/po/components/yaml-editor.po';
import MachineDeploymentsCreateEditPo from '@/cypress/e2e/po/edit/machine-deployments.po';
import MachineDeploymentsListPo from '@/cypress/e2e/po/lists/machine-deployments-list.po';

export default class MachineDeploymentsPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/cluster.x-k8s.io.machinedeployment`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(MachineDeploymentsPagePo.createPath(clusterId));
  }

  constructor(private clusterId = 'local') {
    super(MachineDeploymentsPagePo.createPath(clusterId));
  }

  create() {
    return this.self().find('[data-testid="masthead-create-yaml"]').click();
  }

  createEditMachineDeployment(nsName?: string, machineSetName?: string): MachineDeploymentsCreateEditPo {
    return new MachineDeploymentsCreateEditPo(this.clusterId, nsName, machineSetName);
  }

  list(): MachineDeploymentsListPo {
    return new MachineDeploymentsListPo('[data-testid="cluster-list-container"]');
  }

  yamlEditor(): YamlEditor {
    return new YamlEditor();
  }
}
