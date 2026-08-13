import { FleetDashboardListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import SelectOrCreateAuthPo from '@/cypress/e2e/po/components/select-or-create-auth.po';
import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import KeyValuePo from '@/cypress/e2e/po/components/key-value.po';

export class FleetApplicationListPagePo extends BaseListPagePo {
  static url = `/c/_/fleet/application`;

  constructor() {
    super(FleetApplicationListPagePo.url);
  }

  goTo() {
    return cy.visit(FleetApplicationListPagePo.url);
  }

  navTo() {
    const fleetDashboardPage = new FleetDashboardListPagePo('_');

    FleetDashboardListPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuEntryByLabel('App Bundles');

    this.list().checkVisible();
  }

  create() {
    return this.self().get('.rc-button').contains('Create App Bundle').click();
  }
}

export class FleetApplicationCreatePo extends BaseDetailPagePo {
  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor() {
    super('/c/_/fleet/application/create');
  }

  createGitRepo() {
    return this.self().get(`[data-testid="subtype-banner-item-fleet.cattle.io.gitrepo"]`).click();
  }

  createHelmOp() {
    return this.self().get(`[data-testid="subtype-banner-item-fleet.cattle.io.helmop"]`).click();
  }

  /**
   * The SUSE Application Collection subtype card. Only shown on Rancher Prime and when the
   * `ui-suse-app-collection` setting is not disabled.
   */
  suseAppCollectionSubtype(): Cypress.Chainable {
    return cy.get(`[data-testid="subtype-banner-item-suse-application-collection"]`);
  }
}

export class FleetGitRepoCreateEditPo extends BaseDetailPagePo {
  private static createPath(fleetWorkspace?: string, gitRepoName?: string) {
    const root = `/c/_/fleet/application/fleet.cattle.io.gitrepo`;

    return fleetWorkspace ? `${ root }/${ fleetWorkspace }/${ gitRepoName }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(fleetWorkspace?: string, gitRepoName?: string) {
    super(FleetGitRepoCreateEditPo.createPath(fleetWorkspace, gitRepoName));
  }

  setBranchName(branch = 'dashboard-e2e-basic') {
    return LabeledInputPo.byLabel(this.self(), 'Branch').set(branch);
  }

  setGitRepoUrl(url: string) {
    return LabeledInputPo.byLabel(this.self(), 'Repository URL').set(url);
  }

  setHelmRepoURLRegex(regexStr = 'https://charts.rancher.io/*') {
    return LabeledInputPo.bySelector(this.self(), '[data-testid="gitrepo-helm-repo-url-regex"]').set(regexStr);
  }

  setGitRepoPath(path: string) {
    const repoPaths = this.gitRepoPaths();

    repoPaths.clickAdd('Add Path');
    repoPaths.self().find('[data-testid="main-path"]').type(path);
  }

  /**
   * Add a repository path at a given row index (Custom paths / subpaths feature).
   * `main-path` is repeated once per path row, so target the row by index.
   * testing: https://github.com/rancher/dashboard/pull/14471
   */
  addGitRepoPathAtIndex(path: string, index: number) {
    const repoPaths = this.gitRepoPaths();

    repoPaths.clickAdd('Add Path');
    repoPaths.self().find('[data-testid="main-path"]').eq(index).type(path);
  }

  /**
   * Toggle "Manually specify config files subpaths" for the path row at `index`.
   * Once enabled the subpaths KeyValue editor is revealed for that path.
   * The Checkbox has no data-testid, so it is located by its label within the row.
   */
  enableSubpaths(index: number) {
    return this.gitRepoPaths().self()
      .find(`[data-testid="array-list-box${ index }"] .check`)
      .first()
      .click();
  }

  /**
   * Set a subpath (base + Fleet YAML file) at row `subIndex` for the path at `index`.
   * The subpaths editor is a KeyValue (key="base" / value="options") that renders
   * with an initial empty row, so the first entry is filled in place.
   */
  setSubpath(index: number, base: string, fleetYaml: string, subIndex = 0) {
    const container = `[data-testid="array-list-box${ index }"] .subpaths`;

    this.self().find(`${ container } [data-testid="input-kv-item-key-${ subIndex }"]`).clear()
      .type(base);
    this.self().find(`${ container } [data-testid="kv-item-value-${ subIndex }"]`).clear()
      .type(fleetYaml);
  }

  targetClusterOptions(): RadioGroupInputPo {
    return new RadioGroupInputPo('[data-testid="fleet-target-cluster-radio-button"]');
  }

  targetCluster(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="fleet-target-cluster-name-selector"]');
  }

  targetClusterGroup(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="fleet-target-cluster-group-selector"]');
  }

  gitRepoPaths() {
    return new ArrayListPo('[data-testid="gitRepo-paths"]');
  }

  /**
   * OCI Registry storage secret selector (Advanced step).
   * testing: https://github.com/rancher/dashboard/pull/14414
   */
  ociStorageSecret(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="fleet-oci-storage-secret-list"]');
  }

  enablePollingCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="gitRepo-enablePolling-checkbox"]');
  }

  /**
   * The banner shown when the Polling Interval is below the recommended minimum.
   */
  pollingIntervalMinimumWarning(): Cypress.Chainable {
    return this.self().contains('The recommended minimum Polling Interval');
  }

  subpathsKeyValue(index: number): KeyValuePo {
    return new KeyValuePo(`[data-testid="array-list-box${ index }"] .subpaths`);
  }

  authSelectOrCreate(selector: string) {
    return new SelectOrCreateAuthPo(selector);
  }

  helmAuthSelectOrCreate() {
    return this.authSelectOrCreate('[data-testid="gitrepo-helm-auth"]');
  }

  gitAuthSelectOrCreate() {
    return this.authSelectOrCreate('[data-testid="gitrepo-git-auth"]');
  }

  setPollingInterval(value: number) {
    return LabeledInputPo.byLabel(this.self(), 'Polling Interval').set(value);
  }

  displayAlwaysKeepInformationMessage() {
    this.self().get('[data-testid="checkbox-info-icon"]').eq(0).as('always');

    cy.get('@always').realHover();
    cy.get('@always').should('have.attr', 'data-popper-shown');
  }

  displayPollingInvervalTimeInformationMessage() {
    this.self().get('[data-testid="checkbox-info-icon"]').eq(1).as('polling');

    cy.get('@polling').realHover();
    cy.get('@polling').should('have.attr', 'data-popper-shown');
  }

  displaySelfHealingInformationMessage() {
    this.self().get('[data-testid="labeledTooltip-info-icon"]').eq(0).as('selfhealingicon');

    (cy.get('@selfhealingicon') as any).realHover();
    cy.get('@selfhealingicon').should('have.attr', 'data-popper-shown');
  }
}

export class FleetGitRepoDetailsPo extends BaseDetailPagePo {
  private static createPath(fleetWorkspace: string, gitRepoName: string) {
    return `/c/_/fleet/application/fleet.cattle.io.gitrepo/${ fleetWorkspace }/${ gitRepoName }`;
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
    return this.self().find('[data-testid="resource-bundle-summary"] .count').invoke('text');
  }

  bundlesList() {
    return new ResourceTablePo('#bundles [data-testid="sortable-table-list-container"]');
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
