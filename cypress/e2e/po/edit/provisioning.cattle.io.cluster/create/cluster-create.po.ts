import ClusterManagerCreateImportPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/cluster-create-import.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';

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

  rke2PageTitle(): Cypress.Chainable<string> {
    return this.self().find('.title-bar h1.title, .primaryheader h1').invoke('text');
  }

  gridElementExistanceByName(name: string, assertion: string) {
    return this.self().contains('.grid .name', name, { timeout: 10000 }).should(assertion);
  }

  gridElementGroupTitles() {
    return this.self().find('.subtypes-container > div > h4');
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

  commandFromCustomClusterUI() {
    return this.self().get('code').contains('--insecure');
  }

  activateInsecureRegistrationCommandFromUI() {
    return this.self().get('.checkbox-label').contains('Insecure:');
  }

  customClusterRegistrationCmd(cmd: string) {
    return `ssh -i custom_node.key -o "StrictHostKeyChecking=no" -o "UserKnownHostsFile=/dev/null" root@${ Cypress.env('customNodeIp') } \"nohup ${ cmd }\"`;
  }

  credentialsBanner() {
    return new BannersPo(this.self().find('.banner').contains(`Ok, Let's create a new credential`));
  }

  errorsBanner() {
    return new BannersPo('.banner.error', this.self());
  }
}
