import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

export class FleetDashboardListPagePo extends BaseListPagePo {
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
      return super.goTo(FleetDashboardListPagePo.createPath(clusterId));
    }

    static navTo() {
      BurgerMenuPo.toggle();
      // Give extra time to ensure fleet comes up
      BurgerMenuPo.burgerMenuNavToMenubyLabel('Continuous Delivery', LONG_TIMEOUT_OPT);
    }

    constructor(clusterId: string) {
      super(FleetDashboardListPagePo.createPath(clusterId));
    }

    collapsibleTable(name: string) {
      return new ResourceTablePo(this.self().find(`[data-testid="collapsible-card-${ name }"]`));
    }

    goToGitRepoListLink(name: 'fleet-local' | 'fleet-default') {
      return this.self().find(`[data-testid="collapsible-card-${ name }"] h2 span` );
    }

    fleetDashboardEmptyState() {
      return this.self().get('.fleet-empty-dashboard');
    }

    getStartedButton() {
      return this.self().get('.btn').contains('Get started');
    }
}
