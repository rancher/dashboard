import ClusterManagerCreateImportPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/cluster-create-import.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';

/**
 * Covers core functionality that's common to the dashboard's edit cluster pages
 */
export default class ClusterManagerEditGenericPagePo extends ClusterManagerCreateImportPagePo {
  private static createPath(clusterId: string, clusterName: string) {
    return `/c/${ clusterId }/manager/provisioning.cattle.io.cluster/fleet-default/${ clusterName }`;
  }

  static goTo(clusterId: string, clusterName: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerEditGenericPagePo.createPath(clusterId, clusterName));
  }

  constructor(clusterId = '_', clusterName: string) {
    super(ClusterManagerEditGenericPagePo.createPath(clusterId, clusterName));
  }

  clickTab(selector: string) {
    return new TabbedPo().clickTabWithSelector(selector);
  }

  registryAuthenticationItems() {
    return new ArrayListPo('[data-testid="registry-authentication"]');
  }

  registryAuthenticationField() {
    return new LabeledSelectPo('[data-testid="registry-auth-select-or-create-0"]');
  }
}
