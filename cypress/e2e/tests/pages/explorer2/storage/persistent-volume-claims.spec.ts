import { generatePersistentVolumeClaimsDataSmall, persistentVolumeClaimsNoData } from '@/cypress/e2e/blueprints/explorer/storage/persistent-volume-claims-get';
import { PersistentVolumeClaimsPagePo } from '@/cypress/e2e/po/pages/explorer/persistent-volume-claims.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';

const cluster = 'local';
const persistentVolumeClaimsPage = new PersistentVolumeClaimsPagePo();

describe('PersistentVolumeClaims', { testIsolation: 'off', tags: ['@explorer2', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    before('set up', () => {
      cy.updateNamespaceFilter('local', 'none', '{\"local\":[]}');
    });

    it('validate persistent volume claims table in empty state', () => {
      ClusterDashboardPagePo.goToAndConfirmNsValues(cluster, { all: { is: true } } );

      const tag = 'persistentvolumeclaimsNoData';

      persistentVolumeClaimsNoData(tag);
      PersistentVolumeClaimsPagePo.navTo();
      persistentVolumeClaimsPage.waitForPage();
      cy.wait(`@${ tag }`);

      const expectedHeaders = ['State', 'Name', 'Namespace', 'Status', 'Volume', 'Capacity', 'Access Modes', 'Storage Class', 'VolumeAttributesClass', 'Volume Mode', 'Age'];

      persistentVolumeClaimsPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      persistentVolumeClaimsPage.list().resourceTable().sortableTable().checkRowCount(true, 1);
    });

    it('flat list: validate persistent volume claims table', () => {
      const tag = 'persistentvolumeclaimsDataSmall';

      generatePersistentVolumeClaimsDataSmall(tag);
      persistentVolumeClaimsPage.goTo();
      persistentVolumeClaimsPage.waitForPage();
      cy.wait(`@${ tag }`);

      // check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Namespace', 'Status', 'Volume', 'Capacity', 'Access Modes', 'Storage Class', 'VolumeAttributesClass', 'Volume Mode', 'Age'];

      persistentVolumeClaimsPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      persistentVolumeClaimsPage.list().resourceTable().sortableTable().checkVisible();
      persistentVolumeClaimsPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      persistentVolumeClaimsPage.list().resourceTable().sortableTable().noRowsShouldNotExist();
      persistentVolumeClaimsPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
    });

    // storage/persistent-volume-claims.spec.ts
    it('group by namespace: validate persistent volume claims table', () => {
      const tag = 'persistentvolumeclaimsDataSmall';

      generatePersistentVolumeClaimsDataSmall(tag);
      persistentVolumeClaimsPage.goTo();
      persistentVolumeClaimsPage.waitForPage();
      cy.wait(`@${ tag }`);

      // group by namespace
      persistentVolumeClaimsPage.list().resourceTable().sortableTable().groupByButtons(1)
        .click();

      //  check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Status', 'Volume', 'Capacity', 'Access Modes', 'Storage Class', 'VolumeAttributesClass', 'Volume Mode', 'Age'];

      persistentVolumeClaimsPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      persistentVolumeClaimsPage.list().resourceTable().sortableTable().checkVisible();
      persistentVolumeClaimsPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      persistentVolumeClaimsPage.list().resourceTable().sortableTable().noRowsShouldNotExist();
      persistentVolumeClaimsPage.list().resourceTable().sortableTable().groupElementWithName('Namespace: cattle-system')
        .scrollIntoView()
        .should('be.visible');
      persistentVolumeClaimsPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
    });

    after('clean up', () => {
      cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
    });
  });
});
