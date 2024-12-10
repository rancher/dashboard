import { CustomResourceDefinitionsPagePo } from '@/cypress/e2e/po/pages/explorer/custom-resource-definitions.po';
import { generateCrdsDataSmall } from '@/cypress/e2e/blueprints/explorer/more-resources/api/custom-resource-definition-get';
import * as jsyaml from 'js-yaml';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';

const cluster = 'local';
const crdsPage = new CustomResourceDefinitionsPagePo(cluster);
const crdName = `e2etests.${ +new Date() }.example.com`;
const crdGroup = `${ +new Date() }.example.com`;

describe('CustomResourceDefinitions', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    before(() => {
      ClusterDashboardPagePo.goToAndWait(cluster); // Ensure we're at a solid state before messing with preferences (given login/load might change them)
      cy.tableRowsPerPageAndNamespaceFilter(10, cluster, 'none', '{\"local\":[]}');
    });

    it('can create a crd and see it in list view', () => {
      ClusterDashboardPagePo.goToAndConfirmNsValues(cluster, { all: { is: true } } );

      CustomResourceDefinitionsPagePo.navTo();
      crdsPage.waitForPage();
      crdsPage.create();

      cy.readFile('cypress/e2e/blueprints/explorer/more-resources/api/custom-resource-definition.yml').then((crdYaml) => {
      // convert yaml into json to update name and group values
        const json: any = jsyaml.load(crdYaml);

        json.metadata.name = crdName;
        json.spec.group = crdGroup;

        crdsPage.yamlEditor().set(jsyaml.dump(json));
      });

      cy.intercept('POST', 'v1/apiextensions.k8s.io.customresourcedefinitions').as('createCRD');
      crdsPage.crdCreateEditPo().saveCreateForm().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@createCRD').its('response.statusCode').should('eq', 201);
      crdsPage.waitForPage();
      crdsPage.sortableTable().filter(crdName);
      crdsPage.sortableTable().rowWithName(crdName)
        .column(1)
        .scrollIntoView()
        .should('be.visible');

      // check table headers
      const expectedHeaders = ['State', 'Name', 'Created At'];

      crdsPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });
      crdsPage.sortableTable().filter('{selectAll}{del}');
    });

    it('pagination is visible and user is able to navigate through crd data', () => {
      HomePagePo.goTo();
      // get crd count
      cy.getRancherResource('v1', 'apiextensions.k8s.io.customresourcedefinitions').then((resp: Cypress.Response<any>) => {
        const count = resp.body.count;

        crdsPage.goTo(); // Remove any odd state from previous create (which can result in additional table row not from backend)
        crdsPage.waitForPage();

        // pagination is visible
        crdsPage.sortableTable().pagination().checkVisible();

        // basic checks on navigation buttons
        crdsPage.sortableTable().pagination().beginningButton().isDisabled();
        crdsPage.sortableTable().pagination().leftButton().isDisabled();
        crdsPage.sortableTable().pagination().rightButton().isEnabled();
        crdsPage.sortableTable().pagination().endButton().isEnabled();

        // check text before navigation
        crdsPage.sortableTable().pagination().checkPaginationText(
          crdsPage.productNav(), {
            sideNameLabel: 'CustomResourceDefinitions',
            expectedText:  (count: number) => `1 - 10 of ${ count } CustomResourceDefinitions`
          }
        );

        // navigate to next page - right button
        crdsPage.sortableTable().pagination().rightButton().click();

        // check text and buttons after navigation
        crdsPage.sortableTable().pagination().checkPaginationText(
          crdsPage.productNav(), {
            sideNameLabel: 'CustomResourceDefinitions',
            expectedText:  (count: number) => `11 - 20 of ${ count } CustomResourceDefinitions`
          }
        );
        crdsPage.sortableTable().pagination().beginningButton().isEnabled();
        crdsPage.sortableTable().pagination().leftButton().isEnabled();

        // navigate to first page - left button
        crdsPage.sortableTable().pagination().leftButton().click();

        // check text and buttons after navigation
        crdsPage.sortableTable().pagination().checkPaginationText(
          crdsPage.productNav(), {
            sideNameLabel: 'CustomResourceDefinitions',
            expectedText:  (count: number) => `1 - 10 of ${ count } CustomResourceDefinitions`
          }
        );

        crdsPage.sortableTable().pagination().beginningButton().isDisabled();
        crdsPage.sortableTable().pagination().leftButton().isDisabled();

        // navigate to last page - end button
        crdsPage.sortableTable().pagination().endButton().scrollIntoView()
          .click();

        // row count on last page
        let lastPageCount = count % 10;

        if (lastPageCount === 0) {
          lastPageCount = 10;
        }

        // check text after navigation
        crdsPage.sortableTable().pagination().checkPaginationText(
          crdsPage.productNav(), {
            sideNameLabel: 'CustomResourceDefinitions',
            expectedText:  (count: number) => `${ count - (lastPageCount) + 1 } - ${ count } of ${ count } CustomResourceDefinitions`
          }
        );

        // navigate to first page - beginning button
        crdsPage.sortableTable().pagination().beginningButton().click();

        // check text and buttons after navigation
        crdsPage.sortableTable().pagination().checkPaginationText(
          crdsPage.productNav(), {
            sideNameLabel: 'CustomResourceDefinitions',
            expectedText:  (count: number) => `1 - 10 of ${ count } CustomResourceDefinitions`
          }
        );
        crdsPage.sortableTable().pagination().beginningButton().isDisabled();
        crdsPage.sortableTable().pagination().leftButton().isDisabled();
      });
    });

    it('filter CRDs', () => {
      CustomResourceDefinitionsPagePo.navTo();
      crdsPage.waitForPage();

      crdsPage.sortableTable().checkVisible();
      crdsPage.sortableTable().checkLoadingIndicatorNotVisible();

      // filter by name
      crdsPage.sortableTable().filter(crdName);
      crdsPage.waitForPage(`q=${ crdName }`);
      crdsPage.sortableTable().rowElementWithPartialName(crdName)
        .should('have.length.lte', 1);
      crdsPage.sortableTable().rowElementWithPartialName(crdName).should('be.visible');
    });

    it('sorting changes the order of paginated CRDs data', () => {
      CustomResourceDefinitionsPagePo.navTo();
      crdsPage.waitForPage();
      crdsPage.sortableTable().checkVisible();
      crdsPage.sortableTable().checkNoRowsNotVisible();
      crdsPage.sortableTable().filter('apps');

      let indexBeforeSort: number;

      crdsPage.sortableTable().rowNames().then((rows) => {
        const sortedRows = rows.sort();

        indexBeforeSort = sortedRows.indexOf('apps.catalog.cattle.io');
      });

      // check table is sorted by `name` in ASC order by default
      crdsPage.sortableTable().tableHeaderRow().checkSortOrder(2, 'down');

      // crd name should be visible on first page (sorted in ASC order)
      crdsPage.sortableTable().rowElementWithPartialName('apps.catalog.cattle.io').scrollIntoView().should('be.visible');

      // sort by name in DESC order
      crdsPage.sortableTable().sort(2).click();
      crdsPage.sortableTable().tableHeaderRow().checkSortOrder(2, 'up');

      // check sort order
      crdsPage.sortableTable().rowNames().then((rows) => {
        const sortedRows = rows.sort();
        const indexAfterSort = sortedRows.indexOf(crdName);

        expect(indexAfterSort).not.eq(indexBeforeSort);
      });
    });

    it('pagination is hidden', () => {
      // generate small set of crds data
      generateCrdsDataSmall();
      HomePagePo.goTo(); // this is needed here for the intercept to work
      CustomResourceDefinitionsPagePo.navTo();
      cy.wait('@crdsDataSmall');
      crdsPage.waitForPage();

      crdsPage.sortableTable().checkVisible();
      crdsPage.sortableTable().checkLoadingIndicatorNotVisible();
      crdsPage.sortableTable().checkRowCount(false, 2);
      crdsPage.sortableTable().pagination().checkNotExists();
    });

    after('clean up', () => {
      // delete crd
      cy.deleteRancherResource('v1', 'apiextensions.k8s.io.customresourcedefinitions', crdName);
    });
  });
});
