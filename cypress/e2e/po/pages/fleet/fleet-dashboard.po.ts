import PagePo from '@/cypress/e2e/po/pages/page.po';
import FleetDashboardWorkspaceCardPo from '@/cypress/e2e/po/components/fleet/fleet-dashboard-workspace-card.po';
import { SharedComponentsPo } from '@/cypress/e2e/po/components/shared-components/shared-components.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ButtonGroupPo from '@/cypress/e2e/po/components/button-group.po';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

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

    sharedComponents() {
      return new SharedComponentsPo(this.self());
    }

    workspaceCard(name) {
      return new FleetDashboardWorkspaceCardPo(name);
    }

    slideInPanel() {
      return cy.get('[data-testid="slide-in-panel-component"] [data-testid="fleet-dashboard-resource-details-header"]');
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
