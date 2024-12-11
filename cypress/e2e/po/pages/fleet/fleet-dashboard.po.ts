import PagePo from '@/cypress/e2e/po/pages/page.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export class FleetDashboardPagePo extends PagePo {
    static url: string;

    private static createPath(
      clusterId: string,
      queryParams?: Record<string, string>
    ) {
      const urlStr = `/c/${ clusterId }/fleet`;

      if (!queryParams) {
        return urlStr;
      }

      const params = new URLSearchParams(queryParams);

      return `${ urlStr }?${ params.toString() }`;
    }

    static goTo(clusterId = 'local'): Cypress.Chainable<Cypress.AUTWindow> {
      return super.goTo(FleetDashboardPagePo.createPath(clusterId));
    }

    static navTo() {
      BurgerMenuPo.toggle();
      // Give extra time to ensure fleet comes up
      BurgerMenuPo.burgerMenuNavToMenubyLabel('Continuous Delivery', LONG_TIMEOUT_OPT);
    }

    constructor(clusterId: string) {
      super(FleetDashboardPagePo.createPath(clusterId));
    }

    resourceTable(name: string) {
      const table = this.self().find(`[data-testid="collapsible-card-${ name }"]`);

      return new ResourceTablePo(table);
    }

    sortableTable(tableName = 'fleet-local') {
      return this.resourceTable(tableName).sortableTable();
    }

    goToGitRepoListLink(name: 'fleet-local' | 'fleet-default') {
      return this.self().find(`[data-testid="collapsible-card-${ name }"] h2 span` );
    }

    list() {
      return new BaseResourceList('[data-testid="sortable-table-list-container"]');
    }

    fleetDashboardEmptyState() {
      return this.self().get('.fleet-empty-dashboard');
    }

    getStartedButton() {
      return this.self().get('.btn').contains('Get started');
    }
}
