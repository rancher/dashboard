import PagePo from '@/cypress/e2e/po/pages/page.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import CustomBadgeDialogPo from '@/cypress/e2e/po/components/custom-badge-dialog.po';
import EventsListPo from '@/cypress/e2e/po/lists/events-list.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import CertificatesPo from '@/cypress/e2e/po/components/certificates.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';

export default class ClusterDashboardPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterDashboardPagePo.createPath(clusterId));
  }

  urlPath(clusterId = 'local') {
    return ClusterDashboardPagePo.createPath(clusterId);
  }

  constructor(clusterId: string) {
    super(ClusterDashboardPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();

    burgerMenu.goToCluster(clusterId);
  }

  customizeAppearanceButton() {
    return cy.getId('add-custom-cluster-badge');
  }

  customBadge(): CustomBadgeDialogPo {
    return new CustomBadgeDialogPo();
  }

  eventsList(): EventsListPo {
    return new EventsListPo('[data-testid="sortable-table-list-container"]');
  }

  certificates(): CertificatesPo {
    return new CertificatesPo();
  }

  clickCertificatesTab() {
    this.tabs().self().scrollIntoView();

    return this.tabs().clickNthTab(2);
  }

  tabs() {
    return new TabbedPo('[data-testid="tabbed"]');
  }

  fullEventsLink() {
    return cy.get('[data-testid="events-link"]').contains('Full events list');
  }

  fullSecretsList() {
    return cy.get('.cert-table-link').contains('Full secrets list');
  }

  clusterActionsHeader() {
    return new HeaderPo();
  }

  fleetStatus() {
    return cy.get('[data-testid="k8s-service-fleet"]');
  }

  etcdStatus() {
    return cy.get('[data-testid="k8s-service-etcd"]');
  }

  schedulerStatus() {
    return cy.get('[data-testid="k8s-service-scheduler"]');
  }

  controllerManagerStatus() {
    return cy.get('[data-testid="k8s-service-controller-manager"]');
  }

  /**
   * Confirm that the ns filter is set correctly before navigating to a page that will use it
   * 1. nav to cluster dashboard
   * 2. check ns filter values
   */
  static goToAndConfirmNsValues(cluster: string, {
    nsProject,
    all
  }: {
    nsProject?: {
      values: string[]
    },
    all?: {
      is: boolean,
    }
  }) {
    const instance = new ClusterDashboardPagePo(cluster);
    const nsfilter = new NamespaceFilterPo();

    instance.goTo();
    instance.waitForPage();
    nsfilter.checkVisible();

    if (nsProject) {
      for (let i = 0; i < nsProject.values.length; i++) {
        nsfilter.selectedValues().contains(nsProject.values[i]);
      }
    } else if (all) {
      nsfilter.allSelected();
    } else {
      throw new Error('Bad Config');
    }
  }

  static goToAndWait(cluster: string) {
    const instance = new ClusterDashboardPagePo(cluster);

    instance.goTo();
    instance.clusterActionsHeader().checkVisible();
  }
}
