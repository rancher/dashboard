import PagePo from '@/cypress/e2e/po/pages/page.po';
import EmberListPo from '@/cypress/e2e/po/components/ember/ember-list.po';
import EmberDropdownPo from '@/cypress/e2e/po/components/ember/ember-dropdown.po';
export default class RkeDriversPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/pages/rke-drivers`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(RkeDriversPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(RkeDriversPagePo.createPath(clusterId));
  }

  list(): EmberListPo {
    return new EmberListPo('table.grid.sortable-table');
  }

  actions(): EmberListPo {
    return new EmberListPo('.has-tabs');
  }

  dropdown(): EmberDropdownPo {
    return new EmberDropdownPo('.ember-basic-dropdown-content');
  }
}
