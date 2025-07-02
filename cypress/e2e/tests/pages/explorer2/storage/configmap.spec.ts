import { ConfigMapPagePo } from '@/cypress/e2e/po/pages/explorer/config-map.po';
import ConfigMapPo from '@/cypress/e2e/po/components/storage/config-map.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';

const configMapPage = new ConfigMapPagePo('local');
const localCluster = 'local';

describe('ConfigMap', { testIsolation: 'off', tags: ['@explorer2', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('has the correct title', () => {
    configMapPage.goTo();
    configMapPage.title().should('include', `ConfigMaps`);

    cy.title().should('eq', 'Rancher - local - ConfigMaps');
  });

  it('creates a configmap and displays it in the list', () => {
    const expectedValue = `# Sample XPlanManagerAPI Configuration (if this comment is longer than 80 characters, the output should remain the same)

apiUrl=https://example.com/xplan-api-manager
contactEmailAddress=contact@example.com
termsOfServiceUrl=https://example.com/terms
documentationUrl=https://example.com/docs
wmsUrl=https://example.com/xplan-wms/services
skipSemantic=false
skipGeometric=true`;

    // Visit the main menu and select the 'local' cluster
    // Navigate to Service Discovery => ConfigMaps
    ConfigMapPagePo.navTo();

    // Click on Create
    configMapPage.clickCreate();

    // Enter ConfigMap name
    // Enter ConfigMap key
    // Enter ConfigMap value
    // Enter ConfigMap description
    const configMapPo = new ConfigMapPo();

    // we need to add a variable resource name otherwise future
    // runs of the pipeline will fail because the resource already exists
    const runTimestamp = +new Date();
    const runPrefix = `e2e-test-${ runTimestamp }`;
    const configMapName = `${ runPrefix }-custom-config-map`;

    configMapPo.nameInput().set(configMapName);
    configMapPo.keyInput().set('managerApiConfiguration.properties');
    configMapPo.valueInput().set(expectedValue);
    configMapPo.descriptionInput().set('Custom Config Map Description');

    // Click on Create
    configMapPo.saveCreateForm().click();

    // Check if the ConfigMap is created successfully
    configMapPage.waitForPage();
    configMapPage.searchForConfigMap(configMapName);
    configMapPage.listElementWithName(configMapName).should('exist');

    // Navigate back to the edit page
    configMapPage.list().actionMenu(configMapName).getMenuItem('Edit Config').click();

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    // Assert the current value yaml dumps will append a newline at the end
    configMapPo.valueInput().value().should('eq', `${ expectedValue }\n`);
  });

  it('should show an error banner if the api call sends back an error', () => {
    // Navigate to Service Discovery => ConfigMaps
    ConfigMapPagePo.navTo();
    // Click on Create
    configMapPage.clickCreate();
    // Enter ConfigMap name
    const configMapPo = new ConfigMapPo();

    // Enter an invalid name so the api call fails
    configMapPo.nameInput().set('$^$^"£%');
    // Click on Create
    configMapPo.saveCreateForm().click();
    // Error banner should be displayed
    configMapPo.errorBanner().should('exist').and('be.visible');
  });

  describe('List', { tags: ['@noVai', '@adminUser'] }, () => {
    const uniqueConfigMap = SortableTablePo.firstByDefaultName('cm');
    let cmNamesList = [];
    let nsName1: string;
    let nsName2: string;
    let rootResourceName: string;

    before(() => {
      cy.login();
    });

    before('set up', () => {
      cy.getRootE2EResourceName().then((root) => {
        rootResourceName = root;
      });

      const createConfigMap = (cmName?: string) => {
        return ({ ns, i }: {ns: string, i: number}) => {
          const name = cmName || Cypress._.uniqueId(`${ Date.now().toString() }-${ i }`);

          return cy.createConfigMap(ns, name).then((name) => ({ body: { metadata: { name } } }));
        };
      };

      cy.createManyNamespacedResourced({
        context:        'configmaps1',
        createResource: createConfigMap(),
      })
        .then(({ ns, workloadNames }) => {
          cmNamesList = workloadNames;
          nsName1 = ns;
        })
        .then(() => cy.createManyNamespacedResourced({
          context:        'configmaps2',
          createResource: createConfigMap(uniqueConfigMap),
          count:          1
        }))
        .then(({ ns, workloadNames }) => {
          cmNamesList.push(workloadNames[0]);
          nsName2 = ns;

          cy.tableRowsPerPageAndNamespaceFilter(10, localCluster, 'none', `{\"local\":[\"ns://${ nsName1 }\",\"ns://${ nsName2 }\"]}`);
        });
    });

    it('pagination is visible and user is able to navigate through configmaps data', () => {
      ClusterDashboardPagePo.goToAndConfirmNsValues(localCluster, { nsProject: { values: [nsName1, nsName2] } });

      configMapPage.goTo();
      configMapPage.waitForPage();

      // check configmaps count
      // A kube-root-ca.crt configmap per namespace in the formula has to be included
      const count = cmNamesList.length + 2;

      cy.waitForRancherResources('v1', 'configmaps', count - 1, true).then((resp: Cypress.Response<any>) => {
        // pagination is visible
        configMapPage.list().resourceTable().sortableTable().pagination()
          .checkVisible();

        // basic checks on navigation buttons
        configMapPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        configMapPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
        configMapPage.list().resourceTable().sortableTable().pagination()
          .rightButton()
          .isEnabled();
        configMapPage.list().resourceTable().sortableTable().pagination()
          .endButton()
          .isEnabled();

        // check text before navigation
        configMapPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } ConfigMaps`);
          });

        // navigate to next page - right button
        configMapPage.list().resourceTable().sortableTable().pagination()
          .rightButton()
          .click();

        // check text and buttons after navigation
        configMapPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`11 - 20 of ${ count } ConfigMaps`);
          });
        configMapPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isEnabled();
        configMapPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isEnabled();

        // navigate to first page - left button
        configMapPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .click();

        // check text and buttons after navigation
        configMapPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } ConfigMaps`);
          });
        configMapPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        configMapPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();

        // navigate to last page - end button
        configMapPage.list().resourceTable().sortableTable().pagination()
          .endButton()
          .scrollIntoView()
          .click();

        // row count on last page
        let lastPageCount = count % 10;

        if (lastPageCount === 0) {
          lastPageCount = 10;
        }

        // check text after navigation
        configMapPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`${ count - (lastPageCount) + 1 } - ${ count } of ${ count } ConfigMaps`);
          });

        // navigate to first page - beginning button
        configMapPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .click();

        // check text and buttons after navigation
        configMapPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } ConfigMaps`);
          });
        configMapPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        configMapPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
      });
    });

    it('sorting changes the order of paginated configmaps data', () => {
      configMapPage.goTo();
      configMapPage.waitForPage();
      // use filter to only show test data
      configMapPage.list().resourceTable().sortableTable().filter(rootResourceName);

      // check table is sorted by name in ASC order by default
      configMapPage.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(1, 'down');

      // ConfigMap name should be visible on first page (sorted in ASC order)
      configMapPage.list().resourceTable().sortableTable().tableHeaderRow()
        .self()
        .scrollIntoView();
      configMapPage.list().resourceTable().sortableTable().rowElementWithName(cmNamesList[0])
        .scrollIntoView()
        .should('be.visible');

      // sort by name in DESC order
      configMapPage.list().resourceTable().sortableTable().sort(1)
        .click({ force: true });
      configMapPage.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(1, 'up');

      // ConfigMap name should be NOT visible on first page (sorted in DESC order)
      configMapPage.list().resourceTable().sortableTable().rowElementWithName(cmNamesList[0])
        .should('not.exist');

      // navigate to last page
      configMapPage.list().resourceTable().sortableTable().pagination()
        .endButton()
        .scrollIntoView()
        .click();

      // ConfigMap name should be visible on last page (sorted in DESC order)
      configMapPage.list().resourceTable().sortableTable().rowElementWithName(cmNamesList[0])
        .scrollIntoView()
        .should('be.visible');
    });

    it('filter configmaps', () => {
      configMapPage.goTo();
      configMapPage.waitForPage();

      configMapPage.list().resourceTable().sortableTable().checkVisible();
      configMapPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      configMapPage.list().resourceTable().sortableTable().checkRowCount(false, 10);

      // filter by name
      configMapPage.list().resourceTable().sortableTable().filter(cmNamesList[0]);
      configMapPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      configMapPage.list().resourceTable().sortableTable().rowElementWithName(cmNamesList[0])
        .should('be.visible');

      // filter by namespace
      configMapPage.list().resourceTable().sortableTable().filter(nsName2);
      configMapPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      configMapPage.list().resourceTable().sortableTable().rowElementWithName(uniqueConfigMap)
        .should('be.visible');
    });

    after('clean up', () => {
      // Ensure the default rows per page value is set after running the tests
      cy.tableRowsPerPageAndNamespaceFilter(100, localCluster, 'none', '{"local":["all://user"]}');

      // delete namespace (this will also delete all configmaps in it)
      cy.deleteNamespace([nsName1, nsName2]);
    });
  });
});
