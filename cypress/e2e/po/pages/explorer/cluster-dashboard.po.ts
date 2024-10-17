import PagePo from '@/cypress/e2e/po/pages/page.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import CustomBadgeDialogPo from '@/cypress/e2e/po/components/custom-badge-dialog.po';
import EventsListPo from '@/cypress/e2e/po/lists/events-list.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import CertificatesPo from '@/cypress/e2e/po/components/certificates.po';
import { HeaderPo } from '~/cypress/e2e/po/components/header.po';

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
    return cy.get('.events-table-link').contains('Full events list');
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
}
