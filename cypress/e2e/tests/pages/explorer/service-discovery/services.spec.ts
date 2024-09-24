import { ServicesPagePo } from '@/cypress/e2e/po/pages/explorer/services.po';
import { generateServicesDataSmall, servicesNoData } from '@/cypress/e2e/blueprints/explorer/workloads/service-discovery/services-get';

const servicesPagePo = new ServicesPagePo();

describe('Services', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    before('set up', () => {
      cy.updateNamespaceFilter('local', 'none', '{\"local\":[]}');
    });

    it('validate services table in empty state', () => {
      servicesNoData();
      servicesPagePo.goTo();
      servicesPagePo.waitForPage();
      cy.wait('@servicesNoData');

      const expectedHeaders = ['State', 'Name', 'Namespace', 'Target', 'Selector', 'Type', 'Age'];

      servicesPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      servicesPagePo.list().resourceTable().sortableTable().checkRowCount(true, 1);
    });

    it('flat list: validate services table', () => {
      generateServicesDataSmall();
      servicesPagePo.goTo();
      servicesPagePo.waitForPage();
      cy.wait('@servicesDataSmall');

      // check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Namespace', 'Target', 'Selector', 'Type', 'Age'];

      servicesPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      servicesPagePo.list().resourceTable().sortableTable().checkVisible();
      servicesPagePo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      servicesPagePo.list().resourceTable().sortableTable().noRowsShouldNotExist();
      servicesPagePo.list().resourceTable().sortableTable().checkRowCount(false, 3);
    });

    it('group by namespace: validate services table', () => {
      generateServicesDataSmall();
      servicesPagePo.goTo();
      servicesPagePo.waitForPage();
      cy.wait('@servicesDataSmall');

      // group by namespace
      servicesPagePo.list().resourceTable().sortableTable().groupByButtons(1)
        .click();

      //  check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Target', 'Selector', 'Type', 'Age'];

      servicesPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      servicesPagePo.list().resourceTable().sortableTable().checkVisible();
      servicesPagePo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      servicesPagePo.list().resourceTable().sortableTable().noRowsShouldNotExist();
      servicesPagePo.list().resourceTable().sortableTable().groupElementWithName('Namespace: cattle-system')
        .scrollIntoView()
        .should('be.visible');
      servicesPagePo.list().resourceTable().sortableTable().checkRowCount(false, 3);
    });

    it('validation errors should not be shown when form is just opened', () => {
      servicesPagePo.goTo();
      servicesPagePo.clickCreate();
      servicesPagePo.createServicesForm().errorBanner().should('not.exist');
    });

    after('clean up', () => {
      cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
    });
  });
});
