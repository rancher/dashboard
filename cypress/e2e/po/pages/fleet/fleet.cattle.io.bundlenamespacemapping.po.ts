import PagePo from '@/cypress/e2e/po/pages/page.po';
import { SharedComponentsPo } from '@/cypress/e2e/po/components/shared-components/shared-components.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
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

  sharedComponents() {
    return new SharedComponentsPo(this.self());
  }

  createMappingForm(fleetWorkspace?: string, id?: string): FleetBundleNsMappingCreateEditPo {
    return new FleetBundleNsMappingCreateEditPo(fleetWorkspace, id);
  }
}
