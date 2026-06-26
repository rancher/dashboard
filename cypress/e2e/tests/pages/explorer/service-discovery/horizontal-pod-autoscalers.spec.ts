import { HorizontalPodAutoscalersPagePo } from '@/cypress/e2e/po/pages/explorer/horizontal-pod-autoscalers.po';
import { generateHorizontalPodAutoscalersDataSmall, horizontalPodAutoScalersNoData } from '@/cypress/e2e/blueprints/explorer/workloads/service-discovery/horizontal-pod-autoscalers-get';
import { qase } from '@/cypress/support/qase';

const horizontalPodAutoscalersPage = new HorizontalPodAutoscalersPagePo();

describe('HorizontalPodAutoscalers', { testIsolation: false, tags: ['@explorer', '@adminUser', '@standardUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@noVai', '@adminUser'] }, () => {
    before('set up', () => {
      cy.updateNamespaceFilter('local', 'none', '{\"local\":[]}', { delay: true });
    });

    qase(4117, it('validate HorizontalPodAutoscalers table in empty state', () => {
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
    }));

    qase(4119, it('flat list: validate HorizontalPodAutoscalers table', () => {
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
    }));

    qase(4118, it('group by namespace: validate HorizontalPodAutoscalers table', () => {
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
    }));

    after('clean up', () => {
      cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
    });
  });
});
