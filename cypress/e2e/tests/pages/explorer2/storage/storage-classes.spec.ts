import { generateStorageClassesDataSmall, storageClassesNoData } from '@/cypress/e2e/blueprints/explorer/storage/storage-classes-get';
import { StorageClassesPagePo } from '@/cypress/e2e/po/pages/explorer/storage-classes.po';

const storageClassesPagePo = new StorageClassesPagePo();

describe('StorageClasses', { testIsolation: 'off', tags: ['@explorer2', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    before('set up', () => {
      cy.updateNamespaceFilter('local', 'none', '{\"local\":[]}');
    });

    it('validate storage classes table in empty state', () => {
      storageClassesNoData();
      storageClassesPagePo.goTo();
      storageClassesPagePo.waitForPage();
      cy.wait('@storageclassesNoData');

      const expectedHeaders = ['State', 'Name', 'Provisioner', 'Default', 'Age'];

      storageClassesPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      storageClassesPagePo.list().resourceTable().sortableTable().checkRowCount(true, 1);
    });

    it('validate storage classes table', () => {
      generateStorageClassesDataSmall();
      storageClassesPagePo.goTo();
      storageClassesPagePo.waitForPage();
      cy.wait('@storageclassesDataSmall');

      // check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Provisioner', 'Default', 'Age'];

      storageClassesPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      storageClassesPagePo.list().resourceTable().sortableTable().checkVisible();
      storageClassesPagePo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      storageClassesPagePo.list().resourceTable().sortableTable().noRowsShouldNotExist();
      storageClassesPagePo.list().resourceTable().sortableTable().checkRowCount(false, 1);
    });
    it('can open "Edit as YAML"', () => {
      storageClassesPagePo.goTo();
      storageClassesPagePo.waitForPage();
      storageClassesPagePo.clickCreate();
      storageClassesPagePo.createStorageClassesForm().editAsYaml().click();
      storageClassesPagePo.createStorageClassesForm().yamlEditor().checkExists();
    });

    after('clean up', () => {
      cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
    });
  });
});
