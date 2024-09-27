import { PersistentVolumesPagePo } from '@/cypress/e2e/po/pages/explorer/persistent-volumes.po';
import { generatePersistentVolumesDataSmall, persistentVolumesNoData } from '@/cypress/e2e/blueprints/explorer/storage/persistent-volumes-get';

const persistentVolumesPagePo = new PersistentVolumesPagePo();

describe('PersistentVolumes', { testIsolation: 'off', tags: ['@explorer2', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    before('set up', () => {
      cy.updateNamespaceFilter('local', 'none', '{\"local\":[]}');
    });

    it('validate persistent volumes table in empty state', () => {
      persistentVolumesNoData();
      persistentVolumesPagePo.goTo();
      persistentVolumesPagePo.waitForPage();
      cy.wait('@persistentvolumesNoData');

      const expectedHeaders = ['State', 'Name', 'Reclaim Policy', 'Persistent Volume Claim', 'Source', 'Reason', 'Age'];

      persistentVolumesPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      persistentVolumesPagePo.list().resourceTable().sortableTable().checkRowCount(true, 1);
    });

    it('validate persistent volumes table', () => {
      generatePersistentVolumesDataSmall();
      persistentVolumesPagePo.goTo();
      persistentVolumesPagePo.waitForPage();
      cy.wait('@persistentvolumesDataSmall');

      // check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Reclaim Policy', 'Persistent Volume Claim', 'Source', 'Reason', 'Age'];

      persistentVolumesPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      persistentVolumesPagePo.list().resourceTable().sortableTable().checkVisible();
      persistentVolumesPagePo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      persistentVolumesPagePo.list().resourceTable().sortableTable().noRowsShouldNotExist();
      persistentVolumesPagePo.list().resourceTable().sortableTable().checkRowCount(false, 1);
    });

    it('can open "Edit as YAML"', () => {
      persistentVolumesPagePo.goTo();
      persistentVolumesPagePo.waitForPage();
      persistentVolumesPagePo.clickCreate();
      persistentVolumesPagePo.createPersistentVolumesForm().editAsYaml().click();
      persistentVolumesPagePo.createPersistentVolumesForm().yamlEditor().checkExists();
    });

    after('clean up', () => {
      cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
    });
  });
});
