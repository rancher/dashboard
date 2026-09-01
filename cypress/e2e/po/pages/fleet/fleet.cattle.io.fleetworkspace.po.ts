import { FleetDashboardListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';
import KeyValuePo from '@/cypress/e2e/po/components/key-value.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import LabeledSelectPo from '~/cypress/e2e/po/components/labeled-select.po';

export class FleetWorkspaceListPagePo extends BaseListPagePo {
  static url = `/c/_/fleet/management.cattle.io.fleetworkspace`;

  constructor() {
    super(FleetWorkspaceListPagePo.url);
  }

  goTo() {
    return cy.visit(FleetWorkspaceListPagePo.url);
  }

  static navTo() {
    const fleetDashboardPage = new FleetDashboardListPagePo('_');

    FleetDashboardListPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Resources');
    sideNav.navToSideMenuEntryByLabel('Workspaces');
  }
}

export class FleetWorkspaceCreateEditPo extends BaseDetailPagePo {
  private static createPath(fleetWorkspace?: string) {
    const root = '/c/_/fleet/management.cattle.io.fleetworkspace';

    return fleetWorkspace ? `${ root }/${ fleetWorkspace }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(fleetWorkspace?: string) {
    super(FleetWorkspaceCreateEditPo.createPath(fleetWorkspace));
  }

  allowTargetNsTabList() {
    return new ArrayListPo('section#allowedtargetnamespaces');
  }

  lablesAnnotationsKeyValue() {
    return new KeyValuePo('section#labels');
  }

  defaultOciRegistry() {
    return new LabeledSelectPo('[data-testid="default-oci-storage-secret"]');
  }
}

export class FleetWorkspaceDetailsPo extends BaseDetailPagePo {
  private static createPath(fleetWorkspace: string) {
    return `/c/_/fleet/management.cattle.io.fleetworkspace/${ fleetWorkspace }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(fleetWorkspace: string) {
    super(FleetWorkspaceDetailsPo.createPath(fleetWorkspace));
  }

  workspaceTabs(): TabbedPo {
    return new TabbedPo();
  }

  recentEventsList() {
    return new ResourceTablePo('#events [data-testid="sortable-table-list-container"]');
  }

  relatedResourcesList(index: number) {
    return new ResourceTablePo(`#related div:nth-of-type(${ index })[data-testid="sortable-table-list-container"]`);
  }
}
