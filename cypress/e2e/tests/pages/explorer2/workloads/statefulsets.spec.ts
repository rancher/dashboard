import { WorkloadsStatefulSetsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-statefulsets.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { generateStatefulSetsDataSmall } from '@/cypress/e2e/blueprints/explorer/workloads/statefulsets/statefulsets-get';

describe('StatefulSets', { testIsolation: 'off', tags: ['@explorer2', '@adminUser'] }, () => {
  const localCluster = 'local';
  const statefulSetListPage = new WorkloadsStatefulSetsListPagePo(localCluster);

  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    let uniqueStatefulSet = SortableTablePo.firstByDefaultName('statefulset');
    const statefulSetNamesList = [];
    let nsName1: string;
    let nsName2: string;
    let rootResourceName: string;

    before('set up', () => {
      cy.getRootE2EResourceName().then((root) => {
        rootResourceName = root;
      });

      cy.createE2EResourceName('ns1').then((ns1) => {
        nsName1 = ns1;
        // create namespace
        cy.createNamespace(nsName1);

        // create statefulsets
        let i = 0;

        while (i < 25) {
          const statefulSetName = Cypress._.uniqueId(Date.now().toString());

          cy.createRancherResource('v1', 'apps.statefulset', JSON.stringify({
            apiVersion: 'apps/v1',
            kind:       'StatefulSet',
            metadata:   {
              name:      statefulSetName,
              namespace: nsName1
            },
            spec: {
              replicas:            1,
              serviceName:         statefulSetName,
              podManagementPolicy: 'OrderedReady',
              updateStrategy:      { type: 'RollingUpdate' },
              selector:            { matchLabels: { app: statefulSetName } },
              template:            {
                metadata: { labels: { app: statefulSetName } },
                spec:     {
                  containers: [{
                    name:  'nginx',
                    image: 'nginx:alpine'
                  }]
                }
              }
            }
          })).then((resp) => {
            statefulSetNamesList.push(resp.body.metadata.name);
          });

          i++;
        }

        cy.createE2EResourceName('ns2').then((ns2) => {
          nsName2 = ns2;

          // create namespace
          cy.createNamespace(nsName2);

          // create unique statefulset for filtering/sorting test
          cy.createRancherResource('v1', 'apps.statefulset', JSON.stringify({
            apiVersion: 'apps/v1',
            kind:       'StatefulSet',
            metadata:   {
              name:      uniqueStatefulSet,
              namespace: nsName2
            },
            spec: {
              replicas:            1,
              serviceName:         uniqueStatefulSet,
              podManagementPolicy: 'OrderedReady',
              updateStrategy:      { type: 'RollingUpdate' },
              selector:            { matchLabels: { app: uniqueStatefulSet } },
              template:            {
                metadata: { labels: { app: uniqueStatefulSet } },
                spec:     {
                  containers: [{
                    name:  'nginx',
                    image: 'nginx:alpine'
                  }]
                }
              }
            }
          })).then((resp) => {
            uniqueStatefulSet = resp.body.metadata.name;
          });

          cy.tableRowsPerPageAndNamespaceFilter(10, localCluster, 'none', `{\"local\":[\"ns://${ nsName1 }\",\"ns://${ nsName2 }\"]}`);
        });
      });
    });

    it('pagination is visible and user is able to navigate through statefulsets data', () => {
      ClusterDashboardPagePo.goToAndConfirmNsValues(localCluster, { nsProject: { values: [nsName1, nsName2] } });

      WorkloadsStatefulSetsListPagePo.navTo();
      statefulSetListPage.waitForPage();

      // check statefulsets count
      const count = statefulSetNamesList.length + 1;

      cy.waitForRancherResources('v1', 'apps.statefulset', count - 1, true).then((resp: Cypress.Response<any>) => {
        // pagination is visible
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .checkVisible();

        // basic checks on navigation buttons
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .rightButton()
          .isEnabled();
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .endButton()
          .isEnabled();

        // check text before navigation
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } StatefulSets`);
          });

        // navigate to next page - right button
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .rightButton()
          .click();

        // check text and buttons after navigation
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`11 - 20 of ${ count } StatefulSets`);
          });
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isEnabled();
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isEnabled();

        // navigate to first page - left button
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .click();

        // check text and buttons after navigation
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } StatefulSets`);
          });
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();

        // navigate to last page - end button
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .endButton()
          .scrollIntoView()
          .click();

        // row count on last page
        let lastPageCount = count % 10;

        if (lastPageCount === 0) {
          lastPageCount = 10;
        }

        // check text after navigation
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`${ count - (lastPageCount) + 1 } - ${ count } of ${ count } StatefulSets`);
          });

        // navigate to first page - beginning button
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .click();

        // check text and buttons after navigation
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } StatefulSets`);
          });
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        statefulSetListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
      });
    });

    it('sorting changes the order of paginated statefulsets data', () => {
      WorkloadsStatefulSetsListPagePo.navTo();
      statefulSetListPage.waitForPage();
      // use filter to only show test data
      statefulSetListPage.list().resourceTable().sortableTable().filter(rootResourceName);

      // check table is sorted by name in ASC order by default
      statefulSetListPage.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(2, 'down');

      // statefulset name should be visible on first page (sorted in ASC order)
      statefulSetListPage.list().resourceTable().sortableTable().tableHeaderRow()
        .self()
        .scrollIntoView();
      statefulSetListPage.list().resourceTable().sortableTable().rowElementWithName(statefulSetNamesList[0])
        .scrollIntoView()
        .should('be.visible');

      // sort by name in DESC order
      statefulSetListPage.list().resourceTable().sortableTable().sort(2)
        .click({ force: true });
      statefulSetListPage.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(2, 'up');

      // statefulset name should be NOT visible on first page (sorted in DESC order)
      statefulSetListPage.list().resourceTable().sortableTable().rowElementWithName(statefulSetNamesList[0])
        .should('not.exist');

      // navigate to last page
      statefulSetListPage.list().resourceTable().sortableTable().pagination()
        .endButton()
        .scrollIntoView()
        .click();

      // statefulset name should be visible on last page (sorted in DESC order)
      statefulSetListPage.list().resourceTable().sortableTable().rowElementWithName(statefulSetNamesList[0])
        .scrollIntoView()
        .should('be.visible');
    });

    it('filter statefulsets', () => {
      WorkloadsStatefulSetsListPagePo.navTo();
      statefulSetListPage.waitForPage();

      statefulSetListPage.list().resourceTable().sortableTable().checkVisible();
      statefulSetListPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      statefulSetListPage.list().resourceTable().sortableTable().checkRowCount(false, 10);

      // filter by name
      statefulSetListPage.list().resourceTable().sortableTable().filter(statefulSetNamesList[0]);
      statefulSetListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      statefulSetListPage.list().resourceTable().sortableTable().rowElementWithName(statefulSetNamesList[0])
        .should('be.visible');

      // filter by namespace
      statefulSetListPage.list().resourceTable().sortableTable().filter(nsName2);
      statefulSetListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      statefulSetListPage.list().resourceTable().sortableTable().rowElementWithName(uniqueStatefulSet)
        .should('be.visible');
    });

    it('pagination is hidden', () => {
      cy.tableRowsPerPageAndNamespaceFilter(10, localCluster, 'none', '{"local":[]}');

      // generate small set of statefulsets data
      generateStatefulSetsDataSmall();
      HomePagePo.goTo(); // this is needed here for the intercept to work
      WorkloadsStatefulSetsListPagePo.navTo();
      cy.wait('@statefulSetsDataSmall');
      statefulSetListPage.waitForPage();

      statefulSetListPage.list().resourceTable().sortableTable().checkVisible();
      statefulSetListPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      statefulSetListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      statefulSetListPage.list().resourceTable().sortableTable().pagination()
        .checkNotExists();
    });

    after('clean up', () => {
      // Ensure the default rows per page value is set after running the tests
      cy.tableRowsPerPageAndNamespaceFilter(100, localCluster, 'none', '{"local":["all://user"]}');

      // delete namespace (this will also delete all statefulsets in it)
      cy.deleteRancherResource('v1', 'namespaces', nsName1);
      cy.deleteRancherResource('v1', 'namespaces', nsName2);
    });
  });

  describe('Redeploy Dialog', () => {
    const namespace = `ns-test-${ Date.now() }`;
    const statefulSetName = `sts-test-${ Date.now() }`;
    const apiResource = 'apps.statefulsets';
    const redeployEndpoint = `/v1/${ apiResource }/${ namespace }/${ statefulSetName }`;

    const openRedeployDialog = () => {
      statefulSetListPage.goTo();
      statefulSetListPage.waitForPage();

      statefulSetListPage
        .list()
        .actionMenu(statefulSetName)
        .getMenuItem('Redeploy')
        .click();

      return statefulSetListPage
        .redeployDialog()
        .shouldBeVisible()
        .expectCancelButtonLabel('Cancel')
        .expectApplyButtonLabel('Redeploy');
    };

    before(() => {
      cy.createNamespace(namespace);

      cy.createRancherResource('v1', apiResource, JSON.stringify({
        apiVersion: 'apps/v1',
        kind:       'StatefulSet',
        metadata:   { name: statefulSetName, namespace },
        spec:       {
          replicas:    1,
          serviceName: statefulSetName,
          selector:    { matchLabels: { app: statefulSetName } },
          template:    {
            metadata: { labels: { app: statefulSetName } },
            spec:     {
              containers: [{
                name:  'nginx',
                image: 'nginx:alpine'
              }]
            }
          }
        }
      }));
    });

    it('redeploys successfully after confirmation', () => {
      const dialog = openRedeployDialog();

      dialog.confirmRedeploy(redeployEndpoint);
      dialog.shouldBeClosed();
    });

    it('does not send a request when cancelled', () => {
      cy.intercept('PUT', redeployEndpoint).as('redeployCancelled');

      const dialog = openRedeployDialog();

      dialog.cancel().shouldBeClosed();
      cy.get('@redeployCancelled.all').should('have.length', 0);
    });

    it('displays error banner on failure', () => {
      const dialog = openRedeployDialog();

      dialog.simulateRedeployError(redeployEndpoint);
    });

    after(() => {
      cy.deleteRancherResource('v1', apiResource, `${ namespace }/${ statefulSetName }`);
      cy.deleteRancherResource('v1', 'namespaces', namespace);
    });
  });
});
