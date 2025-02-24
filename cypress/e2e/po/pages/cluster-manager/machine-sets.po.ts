import PagePo from '@/cypress/e2e/po/pages/page.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
import MachineSetsCreateEditPo from '@/cypress/e2e/po/edit/machine-sets.po';
import MachineSetsListPo from '@/cypress/e2e/po/lists/machine-set-list.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';

export default class MachineSetsPagePo extends PagePo {
  private static createPath(clusterId: string = BLANK_CLUSTER) {
    return `/c/${ clusterId }/manager/cluster.x-k8s.io.machineset`;
  }

  static goTo(clusterId: string = BLANK_CLUSTER): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(MachineSetsPagePo.createPath(clusterId));
  }

  constructor(private clusterId = '_') {
    super(MachineSetsPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
    sideNav.groups().contains('Advanced').click();
    sideNav.navToSideMenuEntryByLabel('MachineSets');
  }

  create() {
    return this.list().masthead().actions().contains('Create from YAML')
      .click();
  }

  createEditMachineSet(nsName?: string, machineSetName?: string): MachineSetsCreateEditPo {
    return new MachineSetsCreateEditPo(this.clusterId, nsName, machineSetName);
  }

  list(): MachineSetsListPo {
    return new MachineSetsListPo('[data-testid="sortable-table-list-container"]');
  }

  yamlEditor(): CodeMirrorPo {
    return CodeMirrorPo.bySelector(this.self(), '[data-testid="yaml-editor-code-mirror"]');
  }
}
