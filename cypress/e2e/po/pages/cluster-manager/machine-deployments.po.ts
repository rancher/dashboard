import PagePo from '@/cypress/e2e/po/pages/page.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
import MachineDeploymentsCreateEditPo from '@/cypress/e2e/po/edit/machine-deployments.po';
import MachineDeploymentsListPo from '@/cypress/e2e/po/lists/machine-deployments-list.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';

export default class MachineDeploymentsPagePo extends PagePo {
  private static createPath(clusterId: string = BLANK_CLUSTER) {
    return `/c/${ clusterId }/manager/cluster.x-k8s.io.machinedeployment`;
  }

  static goTo(clusterId: string = BLANK_CLUSTER): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(MachineDeploymentsPagePo.createPath(clusterId));
  }

  constructor(private clusterId = '_') {
    super(MachineDeploymentsPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
    sideNav.groups().contains('Advanced').click();
    sideNav.navToSideMenuEntryByLabel('MachineDeployments');
  }

  create() {
    return this.list().masthead().actions().contains('Create from YAML')
      .click();
  }

  createEditMachineDeployment(nsName?: string, machineSetName?: string): MachineDeploymentsCreateEditPo {
    return new MachineDeploymentsCreateEditPo(this.clusterId, nsName, machineSetName);
  }

  list(): MachineDeploymentsListPo {
    return new MachineDeploymentsListPo('[data-testid="sortable-table-list-container"]');
  }

  yamlEditor(): CodeMirrorPo {
    return CodeMirrorPo.bySelector(this.self(), '[data-testid="yaml-editor-code-mirror"]');
  }
}
