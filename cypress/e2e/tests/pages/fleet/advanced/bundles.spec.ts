import { FleetBundlesListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.bundle.po';
import FleetBundleDetailsPo from '@/cypress/e2e/po/detail/fleet/fleet.cattle.io.bundle.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';

const bundle = 'fleet-agent-local';
const localWorkspace = 'fleet-local';
const defaultWorkspace = 'fleet-default';

describe('Bundles', { testIsolation: 'off', tags: ['@fleet', '@adminUser'] }, () => {
  const fleetBundles = new FleetBundlesListPagePo();
  const headerPo = new HeaderPo();

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    before(() => {
      cy.login();
    });

    it('validate bundles table in empty state', () => {
      FleetBundlesListPagePo.navTo();
      fleetBundles.waitForPage();
      headerPo.selectWorkspace(defaultWorkspace);

      // check table headers
      const expectedHeaders = ['State', 'Name', 'Deployments', 'Age'];

      fleetBundles.bundlesList().resourceTable().sortableTable().tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });
    });

    it('check table headers are available in list and details view', () => {
      FleetBundlesListPagePo.navTo();
      fleetBundles.waitForPage();
      headerPo.selectWorkspace(localWorkspace);

      // check table headers
      const expectedHeaders = ['State', 'Name', 'Deployments', 'Age'];

      fleetBundles.bundlesList().resourceTable().sortableTable().tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      // go to fleet bundle details
      fleetBundles.goToDetailsPage(bundle);

      const fleetBundleeDetailsPage = new FleetBundleDetailsPo(localWorkspace, bundle);

      fleetBundleeDetailsPage.waitForPage();

      // check table headers
      const expectedHeadersDetailsViewEvents = ['State', 'API Version', 'Kind', 'Name', 'Namespace'];

      fleetBundleeDetailsPage.list().resourceTable().sortableTable()
        .tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeadersDetailsViewEvents[i]);
        });
    });
  });
});
