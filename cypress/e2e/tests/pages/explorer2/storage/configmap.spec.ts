import { ConfigMapListPagePo, ConfigMapCreateEditPagePo } from '@/cypress/e2e/po/pages/explorer/config-map.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';

const configMapListPage = new ConfigMapListPagePo('local');
const localCluster = 'local';

describe('ConfigMap', { testIsolation: 'off', tags: ['@explorer2', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('has the correct title', () => {
    configMapListPage.goTo();
    configMapListPage.baseResourceList().masthead().title().should('include', `ConfigMaps`);

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
    ConfigMapListPagePo.navTo();
    configMapListPage.waitForPage();

    // Click on Create
    configMapListPage.baseResourceList().masthead().create();

    // Enter ConfigMap name
    // Enter ConfigMap key
    // Enter ConfigMap value
    // Enter ConfigMap description
    const configMapCreatePo = new ConfigMapCreateEditPagePo();

    // we need to add a variable resource name otherwise future
    // runs of the pipeline will fail because the resource already exists
    const runTimestamp = +new Date();
    const runPrefix = `e2e-test-${ runTimestamp }`;
    const configMapName = `${ runPrefix }-custom-config-map`;
    const namespace = 'default';

    configMapCreatePo.resourceDetail().createEditView().nameNsDescription().name()
      .set(configMapName);
    configMapCreatePo.keyInput().set('managerApiConfiguration.properties');
    configMapCreatePo.valueInput().set(expectedValue);
    configMapCreatePo.resourceDetail().createEditView().nameNsDescription().description()
      .set('Custom Config Map Description');

    // Click on Create
    configMapCreatePo.resourceDetail().createEditView().saveAndWaitForRequests('POST', '/v1/configmaps').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.metadata).to.have.property('name', configMapName);
    });

    // Check if the ConfigMap is created successfully
    configMapListPage.waitForPage();
    configMapListPage.searchForConfigMap(configMapName);
    configMapListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
    configMapListPage.resourceTableDetails(configMapName, 1).should('be.visible');

    // Navigate back to the edit page
    configMapListPage.list().actionMenu(configMapName).getMenuItem('Edit Config').should('be.visible')
      .click();
    const configMapEditPo = new ConfigMapCreateEditPagePo('local', namespace, configMapName);

    configMapEditPo.waitForPage('mode=edit', 'data');

    // Assert the current value yaml dumps will append a newline at the end
    configMapEditPo.valueInput().value().should('eq', `${ expectedValue }\n`);
  });

  it('should show an error banner if the api call sends back an error', () => {
    // Navigate to Service Discovery => ConfigMaps
    ConfigMapListPagePo.navTo();
    configMapListPage.waitForPage();
    // Click on Create
    configMapListPage.baseResourceList().masthead().create();
    // Enter ConfigMap name
    const configMapCreatePo = new ConfigMapCreateEditPagePo();

    // Enter an invalid name so the api call fails
    configMapCreatePo.resourceDetail().createEditView().nameNsDescription().name()
      .set('$^$^"£%');
    // Click on Create
    configMapCreatePo.resourceDetail().createEditView().saveAndWaitForRequests('POST', '/v1/configmaps').then(({ response }) => {
      expect(response?.statusCode).to.eq(422);
    });
    // Error banner should be displayed
    configMapCreatePo.resourceDetail().createEditView().errorBanner().should('exist')
      .and('be.visible');
  });

  describe('List', { tags: ['@noVai', '@adminUser'] }, () => {
    const uniqueConfigMap = SortableTablePo.firstByDefaultName('cm');
    let cmNamesList = [];
    let nsName1: string;
    let nsName2: string;
    let rootResourceName: string;

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

      cy.createManyNamespacedResources({
        context:        'configmaps1',
        createResource: createConfigMap(),
      })
        .then(({ ns, workloadNames }) => {
          cmNamesList = workloadNames;
          nsName1 = ns;
        })
        .then(() => cy.createManyNamespacedResources({
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

      configMapListPage.goTo();
      configMapListPage.waitForPage();

      // check configmaps count
      // A kube-root-ca.crt configmap per namespace in the formula has to be included
      const count = cmNamesList.length + 2;

      cy.waitForRancherResources('v1', 'configmaps', count - 1, true).then((resp: Cypress.Response<any>) => {
        // pagination is visible
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .checkVisible();

        // basic checks on navigation buttons
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .rightButton()
          .isEnabled();
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .endButton()
          .isEnabled();

        // check text before navigation
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } ConfigMaps`);
          });

        // navigate to next page - right button
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .rightButton()
          .click();

        // check text and buttons after navigation
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`11 - 20 of ${ count } ConfigMaps`);
          });
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isEnabled();
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isEnabled();

        // navigate to first page - left button
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .click();

        // check text and buttons after navigation
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } ConfigMaps`);
          });
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();

        // navigate to last page - end button
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .endButton()
          .scrollIntoView()
          .click();

        // row count on last page
        let lastPageCount = count % 10;

        if (lastPageCount === 0) {
          lastPageCount = 10;
        }

        // check text after navigation
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`${ count - (lastPageCount) + 1 } - ${ count } of ${ count } ConfigMaps`);
          });

        // navigate to first page - beginning button
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .click();

        // check text and buttons after navigation
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } ConfigMaps`);
          });
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        configMapListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
      });
    });

    it('sorting changes the order of paginated configmaps data', () => {
      configMapListPage.goTo();
      configMapListPage.waitForPage();
      // use filter to only show test data
      configMapListPage.list().resourceTable().sortableTable().filter(rootResourceName);

      // check table is sorted by name in ASC order by default
      configMapListPage.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(1, 'down');

      // ConfigMap name should be visible on first page (sorted in ASC order)
      configMapListPage.list().resourceTable().sortableTable().tableHeaderRow()
        .self()
        .scrollIntoView();
      configMapListPage.list().resourceTable().sortableTable().rowElementWithName(cmNamesList[0])
        .scrollIntoView()
        .should('be.visible');

      // sort by name in DESC order
      configMapListPage.list().resourceTable().sortableTable().sort(1)
        .click({ force: true });
      configMapListPage.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(1, 'up');

      // ConfigMap name should be NOT visible on first page (sorted in DESC order)
      configMapListPage.list().resourceTable().sortableTable().rowElementWithName(cmNamesList[0])
        .should('not.exist');

      // navigate to last page
      configMapListPage.list().resourceTable().sortableTable().pagination()
        .endButton()
        .scrollIntoView()
        .click();

      // ConfigMap name should be visible on last page (sorted in DESC order)
      configMapListPage.list().resourceTable().sortableTable().rowElementWithName(cmNamesList[0])
        .scrollIntoView()
        .should('be.visible');
    });

    it('filter configmaps', () => {
      configMapListPage.goTo();
      configMapListPage.waitForPage();

      configMapListPage.list().resourceTable().sortableTable().checkVisible();
      configMapListPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      configMapListPage.list().resourceTable().sortableTable().checkRowCount(false, 10);

      // filter by name
      configMapListPage.list().resourceTable().sortableTable().filter(cmNamesList[0]);
      configMapListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      configMapListPage.list().resourceTable().sortableTable().rowElementWithName(cmNamesList[0])
        .should('be.visible');

      // filter by namespace
      configMapListPage.list().resourceTable().sortableTable().filter(nsName2);
      configMapListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      configMapListPage.list().resourceTable().sortableTable().rowElementWithName(uniqueConfigMap)
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
