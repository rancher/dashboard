import { IngressPagePo } from '@/cypress/e2e/po/pages/explorer/ingress.po';
import { generateIngressesDataSmall, ingressesNoData } from '@/cypress/e2e/blueprints/explorer/workloads/service-discovery/ingresses-get';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';

const cluster = 'local';
const ingressPagePo = new IngressPagePo();

describe('Ingresses', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('does not show console warning due to lack of secondary schemas needed to load data on list view', () => {
    // pattern as per https://docs.cypress.io/faq/questions/using-cypress-faq#How-do-I-spy-on-consolelog
    cy.visit(ingressPagePo.urlPath(), {
      onBeforeLoad(win) {
        cy.stub(win.console, 'warn').as('consoleWarn');
      },
    });

    const warnMsg = "pathExistsInSchema requires schema networking.k8s.io.ingress to have resources fields via schema definition but none were found. has the schema 'fetchResourceFields' been called?";

    // testing https://github.com/rancher/dashboard/issues/11086
    cy.get('@consoleWarn').should('not.be.calledWith', warnMsg);

    cy.title().should('eq', 'Rancher - local - Ingresses');
  });
  it('can open "Edit as YAML"', () => {
    ingressPagePo.goTo();
    ingressPagePo.clickCreate();
    ingressPagePo.createIngressForm().editAsYaml().click();
    ingressPagePo.createIngressForm().yamlEditor().checkExists();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    before('set up', () => {
      cy.updateNamespaceFilter(cluster, 'none', '{\"local\":[]}');
    });

    it('validate services table in empty state', () => {
      ClusterDashboardPagePo.goToAndConfirmNsValues(cluster, { all: { is: true } });

      ingressesNoData();
      IngressPagePo.navTo();
      ingressPagePo.waitForPage();
      cy.wait('@ingressesNoData');

      const expectedHeaders = ['State', 'Name', 'Namespace', 'Target', 'Default', 'Ingress Class', 'Age'];

      ingressPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      ingressPagePo.list().resourceTable().sortableTable().checkRowCount(true, 1);
    });

    it('flat list: validate ingresses table', () => {
      generateIngressesDataSmall();
      ingressPagePo.goTo();
      ingressPagePo.waitForPage();
      cy.wait('@ingressesDataSmall');

      // check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Namespace', 'Target', 'Default', 'Ingress Class', 'Age'];

      ingressPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      ingressPagePo.list().resourceTable().sortableTable().checkVisible();
      ingressPagePo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      ingressPagePo.list().resourceTable().sortableTable().noRowsShouldNotExist();
      ingressPagePo.list().resourceTable().sortableTable().checkRowCount(false, 2);
    });

    it('group by namespace: validate ingresses table', () => {
      generateIngressesDataSmall();
      ingressPagePo.goTo();
      ingressPagePo.waitForPage();
      cy.wait('@ingressesDataSmall');

      // group by namespace
      ingressPagePo.list().resourceTable().sortableTable().groupByButtons(1)
        .click();

      //  check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Target', 'Default', 'Ingress Class', 'Age'];

      ingressPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      ingressPagePo.list().resourceTable().sortableTable().checkVisible();
      ingressPagePo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      ingressPagePo.list().resourceTable().sortableTable().noRowsShouldNotExist();
      ingressPagePo.list().resourceTable().sortableTable().groupElementWithName('Namespace: cattle-system')
        .should('be.visible');
      ingressPagePo.list().resourceTable().sortableTable().checkRowCount(false, 2);
    });

    after('clean up', () => {
      cy.updateNamespaceFilter(cluster, 'none', '{"local":["all://user"]}');
    });
  });
});
