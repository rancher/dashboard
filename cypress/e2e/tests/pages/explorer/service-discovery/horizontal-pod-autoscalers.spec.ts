import { HorizontalPodAutoscalersPagePo } from '@/cypress/e2e/po/pages/explorer/horizontal-pod-autoscalers.po';
import { generateHorizontalPodAutoscalersDataSmall, horizontalPodAutoScalersNoData } from '@/cypress/e2e/blueprints/explorer/workloads/service-discovery/horizontal-pod-autoscalers-get';

const horizontalPodAutoscalersPage = new HorizontalPodAutoscalersPagePo();

describe('HorizontalPodAutoscalers', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    before('set up', () => {
      cy.updateNamespaceFilter('local', 'none', '{\"local\":[]}');
    });

    it('validate HorizontalPodAutoscalers table in empty state', () => {
      horizontalPodAutoScalersNoData();
      horizontalPodAutoscalersPage.goTo();
      horizontalPodAutoscalersPage.waitForPage();
      cy.wait('@horizontalpodautoscalerNoData');

      const expectedHeaders = ['State', 'Name', 'Namespace', 'Workload', 'Minimum Replicas', 'Maximum Replicas', 'Current Replicas', 'Age'];

      horizontalPodAutoscalersPage.list().resourceTable().sortableTable().tableHeaderRow()
        .self()
        .scrollIntoView();
      horizontalPodAutoscalersPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      horizontalPodAutoscalersPage.list().resourceTable().sortableTable().checkRowCount(true, 1);
    });

    it('flat list: validate HorizontalPodAutoscalers table', () => {
      generateHorizontalPodAutoscalersDataSmall();
      horizontalPodAutoscalersPage.goTo();
      horizontalPodAutoscalersPage.waitForPage();
      cy.wait('@horizontalpodautoscalerDataSmall');

      horizontalPodAutoscalersPage.header().selectNamespaceFilterOption('All Namespaces');

      // check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Namespace', 'Workload', 'Minimum Replicas', 'Maximum Replicas', 'Current Replicas', 'Age'];

      horizontalPodAutoscalersPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      horizontalPodAutoscalersPage.list().resourceTable().sortableTable().checkVisible();
      horizontalPodAutoscalersPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      horizontalPodAutoscalersPage.list().resourceTable().sortableTable().noRowsShouldNotExist();
      horizontalPodAutoscalersPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
    });

    it('group by namespace: validate HorizontalPodAutoscalers table', () => {
      generateHorizontalPodAutoscalersDataSmall();
      horizontalPodAutoscalersPage.goTo();
      horizontalPodAutoscalersPage.waitForPage();
      cy.wait('@horizontalpodautoscalerDataSmall');

      horizontalPodAutoscalersPage.header().selectNamespaceFilterOption('All Namespaces');

      // group by namespace
      horizontalPodAutoscalersPage.list().resourceTable().sortableTable().groupByButtons(1)
        .click();

      //  check table headers are visible (minus namespace given we're now grouped by it)
      const expectedHeaders = ['State', 'Name', 'Workload', 'Minimum Replicas', 'Maximum Replicas', 'Current Replicas', 'Age'];

      horizontalPodAutoscalersPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      horizontalPodAutoscalersPage.list().resourceTable().sortableTable().checkVisible();
      horizontalPodAutoscalersPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      horizontalPodAutoscalersPage.list().resourceTable().sortableTable().noRowsShouldNotExist();
      horizontalPodAutoscalersPage.list().resourceTable().sortableTable().groupElementWithName('Namespace: cattle-system')
        .should('be.visible');
      horizontalPodAutoscalersPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
    });

    after('clean up', () => {
      cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
    });
  });
});
