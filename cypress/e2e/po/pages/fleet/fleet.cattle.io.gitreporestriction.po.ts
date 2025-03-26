import PagePo from '@/cypress/e2e/po/pages/page.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import FleetGitRepoRestrictionList from '@/cypress/e2e/po/lists/fleet/fleet.cattle.io.gitreporestriction.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import FleetRestrictionCreateEditPo from '@/cypress/e2e/po/edit/fleet/fleet.cattle.io.gitreporestriction.po';

export class FleetGitRepoRestrictionListPagePo extends PagePo {
  static url = `/c/_/fleet/fleet.cattle.io.gitreporestriction`

  constructor() {
    super(FleetGitRepoRestrictionListPagePo.url);
  }

  goTo() {
    return cy.visit(FleetGitRepoRestrictionListPagePo.url);
  }

  static navTo() {
    const fleetDashboardPage = new FleetDashboardPagePo('_');

    FleetDashboardPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Advanced');
    sideNav.navToSideMenuEntryByLabel('GitRepoRestrictions');
  }

  restrictionList() {
    return new FleetGitRepoRestrictionList('[data-testid="sortable-table-list-container"]');
  }

  goToDetailsPage(elemName: string) {
    const resourceTable = new ResourceTablePo(this.self());

    return resourceTable.sortableTable().detailsPageLinkWithName(elemName).click();
  }

  resourceTable() {
    return new ResourceTablePo(this.self());
  }

  baseResourceList() {
    return new BaseResourceList(this.self());
  }

  resourceDetail() {
    return new ResourceDetailPo(this.self());
  }

  createYaml() {
    return this.self().find('[data-testid="masthead-create-yaml"]').click();
  }

  createRestrictionForm(fleetWorkspace?: string, id?: string): FleetRestrictionCreateEditPo {
    return new FleetRestrictionCreateEditPo(fleetWorkspace, id);
  }
}
