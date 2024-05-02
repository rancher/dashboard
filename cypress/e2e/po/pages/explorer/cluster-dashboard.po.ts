import PagePo from '@/cypress/e2e/po/pages/page.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import CustomBadgeDialogPo from '@/cypress/e2e/po/components/custom-badge-dialog.po';
import EventsListPo from '@/cypress/e2e/po/lists/events-list.po';
export default class ClusterDashboardPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterDashboardPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(ClusterDashboardPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();

    BurgerMenuPo.toggle();
    burgerMenu.clusters().contains(clusterId).click();
  }

  clusterToolsButton(): Cypress.Chainable {
    return cy.get('.tools-button').contains('Cluster Tools');
  }

  addCustomBadge(label: string) {
    return cy.getId('add-custom-cluster-badge').contains(label);
  }

  customBadge(): CustomBadgeDialogPo {
    return new CustomBadgeDialogPo();
  }

  eventslist(): EventsListPo {
    return new EventsListPo('[data-testid="sortable-table-list-container"]');
  }

  fullEventsLink() {
    return cy.get('.events-table-link').contains('Full events list');
  }

  resourceSearchButton(): Cypress.Chainable {
    return cy.get('[data-testid="header-resource-search"]');
  }
}
