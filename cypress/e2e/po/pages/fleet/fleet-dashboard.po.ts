import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import FleetDashboardWorkspaceCardPo from '@/cypress/e2e/po/components/fleet/fleet-dashboard-workspace-card.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ButtonGroupPo from '@/cypress/e2e/po/components/button-group.po';
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

    workspaceCard(name) {
      return new FleetDashboardWorkspaceCardPo(name);
    }

    slideInPanel() {
      return cy.get('[data-testid="slide-in-panel-component"]');
    }

    fleetDashboardEmptyState() {
      return this.self().get('.fleet-empty-dashboard');
    }

    getStartedButton() {
      return this.self().get('.btn').contains('Get started');
    }

    viewModeButton() {
      return new ButtonGroupPo('[data-testid="view-button"]', this.self());
    }
}
