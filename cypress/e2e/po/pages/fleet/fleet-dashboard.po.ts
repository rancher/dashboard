import PagePo from '@/cypress/e2e/po/pages/page.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

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
      BurgerMenuPo.burgerMenuNavToMenubyLabel('Continuous Delivery');
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
}
