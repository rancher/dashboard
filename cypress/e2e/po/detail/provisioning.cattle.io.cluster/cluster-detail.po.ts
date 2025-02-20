import PagePo from '@/cypress/e2e/po/pages/page.po';
import MachinePoolsListPo from '@/cypress/e2e/po/lists/machine-pools-list.po';
import ClusterConditionsListPo from '~/cypress/e2e/po/lists/cluster-conditions-list.po';
import ClusterProvisioningLogPo from '~/cypress/e2e/po/lists/cluster-provisioning-log.po';
import ClusterReferredToListPo from '~/cypress/e2e/po/lists/cluster-referred-to-list.po';
import ClusterSnapshotsListPo from '~/cypress/e2e/po/lists/cluster-snapshots-list.po';
import TabbedPo from '~/cypress/e2e/po/components/tabbed.po';
import ClusterRecentEventsListPo from '~/cypress/e2e/po/lists/cluster-recent-events-list.po';

/**
 * Covers core functionality that's common to the dashboard's cluster detail pages
 */
export default abstract class ClusterManagerDetailPagePo extends PagePo {
  private static createPath(clusterId: string, clusterName: string, tab?: string) {
    const namespace = clusterName === 'local' ? 'fleet-local' : 'fleet-default';

    return `/c/${ clusterId }/manager/provisioning.cattle.io.cluster/${ namespace }/${ clusterName }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', clusterName: string) {
    super(ClusterManagerDetailPagePo.createPath(clusterId, clusterName));
  }

  title() {
    return this.self().find('.primaryheader h1');
  }

  logsContainer() {
    return new ClusterProvisioningLogPo(this.self()).logsContainer();
  }

  kubectlCommandForImported() {
    return this.self().get('code');
  }

  machinePoolsList() {
    return new MachinePoolsListPo(this.self().find('[data-testid="sortable-table-list-container"]'));
  }

  conditionsList() {
    return new ClusterConditionsListPo(this.self().find('.sortable-table'));
  }

  referredToList() {
    return new ClusterReferredToListPo(this.self().find('[data-testid="sortable-table-list-container"]'));
  }

  snapshotsList() {
    return new ClusterSnapshotsListPo(this.self().get('[data-testid="cluster-snapshots-list"]'));
  }

  recentEventsList() {
    return new ClusterRecentEventsListPo(this.self().get('.sortable-table'));
  }

  selectTab(options: TabbedPo, selector: string) {
    options.clickTabWithSelector(selector);

    return this;
  }

  namespace() {
    return cy.get('[data-testid="masthead-subheader-namespace"]');
  }
}
