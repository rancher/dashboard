import PagePo from '@/cypress/e2e/po/pages/page.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import BundlesTab from '@/cypress/e2e/po/detail/fleet/tabs/bundles-tab.po';

/**
 * Details component for fleet.cattle.io.gitrepo resources
 */
export default class FleetGitRepoDetailsPo extends PagePo {
  private static createPath(fleetWorkspace: string, gitRepoName: string) {
    return `/c/_/fleet/fleet.cattle.io.gitrepo/${ fleetWorkspace }/${ gitRepoName }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(fleetWorkspace: string, gitRepoName: string) {
    super(FleetGitRepoDetailsPo.createPath(fleetWorkspace, gitRepoName));
  }

  gitRepoTabs(): TabbedPo {
    return new TabbedPo();
  }

  bundlesCount(): Cypress.Chainable {
    return this.self().find('[data-testid="gitrepo-bundle-summary"] .count').invoke('text');
  }

  bundlesTab() {
    return new BundlesTab();
  }

  shwoConfig() {
    this.self().find('[data-testid="button-group-child-1"]').click();
  }

  showGraph() {
    this.self().find('[data-testid="button-group-child-2"]').click();
  }

  graph() {
    return this.self().find('[data-testid="gitrepo_graph"]');
  }
}
