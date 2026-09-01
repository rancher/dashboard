import PagePo from '@/cypress/e2e/po/pages/page.po';

/**
 * Details component for fleet.cattle.io.applications resources
 */
export default class FleetApplicationDetailsPo extends PagePo {
  private static createPath(fleetWorkspace: string, appName: string, type: string) {
    return `/c/_/fleet/application/${ type }/${ fleetWorkspace }/${ appName }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(fleetWorkspace: string, appName: string, type: string) {
    super(FleetApplicationDetailsPo.createPath(fleetWorkspace, appName, type));
  }

  bundlesCount(): Cypress.Chainable {
    return this.self().find('[data-testid="resource-bundle-summary"] .count').invoke('text');
  }

  showConfig() {
    this.self().find('[data-testid="button-group-child-1"]').click();
  }

  showGraph() {
    this.self().find('[data-testid="button-group-child-2"]').click();
  }

  graph() {
    return this.self().find('[data-testid="resource-graph"]');
  }
}
