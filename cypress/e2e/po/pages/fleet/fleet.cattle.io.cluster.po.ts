import PagePo from '@/cypress/e2e/po/pages/page.po';
import FleetClusterList from '@/cypress/e2e/po/lists/fleet/fleet.cattle.io.cluster.po';

export class FleetClusterListPagePo extends PagePo {
    static url = `/c/_/fleet/fleet.cattle.io.cluster`

    constructor() {
      super(FleetClusterListPagePo.url);
    }

    goTo() {
      return cy.visit(FleetClusterListPagePo.url);
    }

    selectWorkspace(workspaceName = 'fleet-local') {
      return this.header().selectWorkspace(workspaceName);
    }

    sortableTable() {
      return new FleetClusterList(this.self()).resourceTable().sortableTable();
    }

    rowActionMenuOpen(label: string) {
      return this.sortableTable().rowActionMenuOpen(label);
    }

    checkRowCount(isEmpty: boolean, expected: number) {
      this.sortableTable().checkRowCount(isEmpty, expected);
    }
}
