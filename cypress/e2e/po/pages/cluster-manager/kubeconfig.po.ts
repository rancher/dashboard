import PagePo from '@/cypress/e2e/po/pages/page.po';
import KubeconfigListPo from '@/cypress/e2e/po/lists/kubeconfig-list.po';

export default class KubeconfigPagePo extends PagePo {
  private static createPath(clusterId: string, id?: string) {
    const root = `/c/${ clusterId }/manager/ext.cattle.io.kubeconfig`;

    return id ? `${ root }/${ id }` : root;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(KubeconfigPagePo.createPath(clusterId));
  }

  /**
   * @param clusterId
   * @param id - kubeconfig resource id, e.g. from the create API response. When given, navigates
   * straight to that resource's detail page (ext.cattle.io.kubeconfig is not namespaced) instead
   * of the list, since the list's own columns (clusters/ttl/age) don't display the resource's
   * name/id as visible text to match a row on.
   */
  constructor(clusterId = '_', id?: string) {
    super(KubeconfigPagePo.createPath(clusterId, id));
  }

  list(): KubeconfigListPo {
    return new KubeconfigListPo('[data-testid="sortable-table-list-container"]');
  }
}
