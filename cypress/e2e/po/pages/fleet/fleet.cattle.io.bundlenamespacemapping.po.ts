import PagePo from '@/cypress/e2e/po/pages/page.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import FleetBundleNamespaceMappingList from '@/cypress/e2e/po/lists/fleet/fleet.cattle.io.bundlenamespacemapping.po';
import FleetBundleNsMappingCreateEditPo from '@/cypress/e2e/po/edit/fleet/fleet.cattle.io.bundlenamespacemapping.po';

export class FleetBundleNamespaceMappingListPagePo extends PagePo {
  static url = `/c/_/fleet/fleet.cattle.io.bundlenamespacemapping`

  constructor() {
    super(FleetBundleNamespaceMappingListPagePo.url);
  }

  goTo() {
    return cy.visit(FleetBundleNamespaceMappingListPagePo.url);
  }

  static navTo() {
    const fleetDashboardPage = new FleetDashboardPagePo('_');

    FleetDashboardPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Advanced');
    sideNav.navToSideMenuEntryByLabel('Bundle Namespace Mappings');
  }

  mappingsList() {
    return new FleetBundleNamespaceMappingList('[data-testid="sortable-table-list-container"]');
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

  createMappingForm(fleetWorkspace?: string, id?: string): FleetBundleNsMappingCreateEditPo {
    return new FleetBundleNsMappingCreateEditPo(fleetWorkspace, id);
  }
}
