import PagePo from '@/cypress/e2e/po/pages/page.po';
import MachinesCreateEditPo from '@/cypress/e2e/po/edit/machines.po';
import MachinesListPo from '@/cypress/e2e/po/lists/machines-list.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';

export default class MachinesPagePo extends PagePo {
  private static createPath(clusterId: string = BLANK_CLUSTER) {
    return `/c/${ clusterId }/manager/cluster.x-k8s.io.machine`;
  }

  static goTo(clusterId: string = BLANK_CLUSTER): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(MachinesPagePo.createPath(clusterId));
  }

  constructor(private clusterId = '_') {
    super(MachinesPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
    sideNav.groups().contains('Advanced').click();
    sideNav.navToSideMenuEntryByLabel('Machines');
  }

  create() {
    return this.list().masthead().actions().contains('Create from YAML')
      .click();
  }

  createEditMachines(nsName?: string, machineName?: string): MachinesCreateEditPo {
    return new MachinesCreateEditPo(this.clusterId, nsName, machineName);
  }

  list(): MachinesListPo {
    return new MachinesListPo('[data-testid="sortable-table-list-container"]');
  }

  yamlEditor(): CodeMirrorPo {
    return CodeMirrorPo.bySelector(this.self(), '[data-testid="yaml-editor-code-mirror"]');
  }
}
