import ToggleSwitchPo from '@/cypress/e2e/po/components/toggle-switch.po';
import ClusterManagerCreateImportPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/cluster-create-import.po';

/**
 * Covers core functionality that's common to the dashboard's create cluster pages
 */
export default class ClusterManagerCreatePagePo extends ClusterManagerCreateImportPagePo {
  static url(clusterId: string) {
    return `/c/${ clusterId }/manager/provisioning.cattle.io.cluster/create`;
  }

  private static createPath(clusterId: string, queryParams?: string) {
    return `${ ClusterManagerCreatePagePo.url(clusterId) }${ queryParams ? `?${ queryParams }` : '' }`;
  }

  static goTo(clusterId: string, queryParams?: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerCreatePagePo.createPath(clusterId, queryParams));
  }

  constructor(clusterId = '_', queryParams?: string) {
    super(ClusterManagerCreatePagePo.createPath(clusterId, queryParams));
  }

  rke1PageTitle(): Cypress.Chainable<string> {
    return cy.iFrame().find('.header h1').invoke('text');
  }

  rke2PageTitle(): Cypress.Chainable<string> {
    return this.self().find('.primaryheader h1').invoke('text');
  }

  rkeToggle() {
    return new ToggleSwitchPo('.toggle-container', this.self());
  }

  selectKubeProvider(index: number) {
    return this.resourceDetail().cruResource().selectSubType(0, index).click();
  }

  selectCreate(index: number) {
    return this.resourceDetail().cruResource().selectSubType(1, index).click();
  }

  selectCustom(index: number) {
    return this.resourceDetail().cruResource().selectSubType(2, index).click();
  }
}
