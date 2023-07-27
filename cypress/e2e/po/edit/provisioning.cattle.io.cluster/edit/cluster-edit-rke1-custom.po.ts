import ClusterManagerCreateRke1CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1-custom.po';

export default class ClusterManagerEditRke1CustomPagePo extends ClusterManagerCreateRke1CustomPagePo {
  static url = '/c/local/manager/provisioning.cattle.io.cluster/fleet-default'

  private static createPath(clusterName: string, tab?: string) {
    return `${ this.url }/${ clusterName }`;
  }

  static goTo(clusterName: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerEditRke1CustomPagePo.createPath(clusterName));
  }

  constructor(clusterName: string) {
    super(ClusterManagerEditRke1CustomPagePo.createPath(clusterName));
  }
}
