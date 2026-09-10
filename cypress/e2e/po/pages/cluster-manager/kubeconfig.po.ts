import PagePo from '@/cypress/e2e/po/pages/page.po';
import KubeconfigListPo from '@/cypress/e2e/po/lists/kubeconfig-list.po';

export default class KubeconfigPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/ext.cattle.io.kubeconfig`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(KubeconfigPagePo.createPath(clusterId));
  }

  constructor(private clusterId = '_') {
    super(KubeconfigPagePo.createPath(clusterId));
  }

  list(): KubeconfigListPo {
    return new KubeconfigListPo('[data-testid="sortable-table-list-container"]');
  }
}
