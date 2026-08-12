import { WorkloadsDaemonsetsListPagePo, WorkLoadsDaemonsetsEditPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-daemonsets.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { generateDaemonSetsDataSmall } from '@/cypress/e2e/blueprints/explorer/workloads/daemonsets/daemonsets-get';
import { SMALL_CONTAINER } from '@/cypress/e2e/tests/pages/explorer2/workloads/workload.utils';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

describe('DaemonSets', { testIsolation: false, tags: ['@explorer2', '@adminUser'] }, () => {
  const localCluster = 'local';

  before(() => {
    cy.login();
  });

  it('modifying "Scaling and Upgrade Policy" to "On Delete" should use the correct property "OnDelete"', () => {
    const daemonsetName = 'daemonset-test';

    // to test payload of https://github.com/rancher/dashboard/issues/9874
    // we need to mock the PUT reply otherwise we get 409 conflict
    cy.intercept('PUT', `/v1/apps.daemonsets/default/${ daemonsetName }`, (req: any) => {
      req.reply({
        statusCode: 200,
        body:       {}
      });
    }).as('daemonsetEdit');

    // Idempotent across retries (testIsolation is off): the deterministic name would 409 on a
    // re-create once a prior attempt created it, so remove any leftover first.
    cy.deleteRancherResource('v1', 'apps.daemonsets', `default/${ daemonsetName }`, false);

    // list view for daemonsets
    const workloadsDaemonsetsListPage = new WorkloadsDaemonsetsListPagePo(localCluster);

    workloadsDaemonsetsListPage.goTo();
    workloadsDaemonsetsListPage.waitForPage();
    workloadsDaemonsetsListPage.baseResourceList().masthead().create();

    // create a new daemonset
    const workloadsDaemonsetsEditPage = new WorkLoadsDaemonsetsEditPagePo(localCluster);

    workloadsDaemonsetsEditPage.resourceDetail().createEditView().nameNsDescription()
      .name()
      .set(daemonsetName);
    workloadsDaemonsetsEditPage.containerImageInput().set('nginx');
    workloadsDaemonsetsEditPage.resourceDetail().cruResource().saveOrCreate()
      .click();

    workloadsDaemonsetsListPage.waitForPage();
    workloadsDaemonsetsListPage.baseResourceList().checkVisible();
    // Confirm the list has finished loading before opening the edit form: we flick quickly
    // between the list and the edit form, and if the list is still loading the SPA nav can
    // land on a form whose tabs never render. Gating on the loading indicator (the same
    // approach as the jobs.spec create flow) fixes the race without a direct-nav workaround.
    workloadsDaemonsetsListPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
    workloadsDaemonsetsListPage.list().resourceTable().sortableTable()
      .rowElementWithName(daemonsetName)
      .should('be.visible');
    workloadsDaemonsetsListPage.list().actionMenu(daemonsetName).getMenuItem('Edit Config')
      .click();

    // edit daemonset
    // Opening the edit form is a SPA navigation + fetch. Clicking a tab before the form has mounted
    // its tab bar leaves #DaemonSet unresolved and times out across retries (gating on the list
    // loading indicator above isn't enough - the race is the edit form mounting). Wait for the edit
    // route to commit and the tab bar to render before clicking a tab.
    cy.url().should('include', `apps.daemonset/default/${ daemonsetName }`);
    cy.get('.dashboard-root').find('#DaemonSet', LONG_TIMEOUT_OPT).should('be.visible');
    workloadsDaemonsetsEditPage.clickTab('#DaemonSet');
    workloadsDaemonsetsEditPage.clickTab('#upgrading');
    workloadsDaemonsetsEditPage.ScalingUpgradePolicyRadioBtn().set(1);
    workloadsDaemonsetsEditPage.resourceDetail().cruResource().saveOrCreate()
      .click();

    workloadsDaemonsetsListPage.baseResourceList().resourceTable().sortableTable()
      .rowElementWithName(daemonsetName)
      .should('be.visible');

    cy.wait('@daemonsetEdit', { requestTimeout: 4000 }).then((req) => {
      expect(req.request.body.spec.updateStrategy.type).to.equal('OnDelete');
    });
  });

  describe('List', { tags: ['@adminUser'] }, () => {
    const daemonSetsListPage = new WorkloadsDaemonsetsListPagePo(localCluster);

    let uniqueDaemonSet = SortableTablePo.firstByDefaultName('daemonset');
    let daemonSetNamesList = [];
    let nsName1: string;
    let nsName2: string;
    let rootResourceName: string;

    before('set up', () => {
      cy.getRootE2EResourceName().then((root) => {
        rootResourceName = root;
      });

      const createDs = (daemonSetName?: string) => {
        return ({ ns, i }: {ns: string, i: number}) => {
          const name = daemonSetName || Cypress._.uniqueId(`${ Date.now().toString() }-${ i }`);

          return cy.createRancherResource('v1', 'apps.daemonset', JSON.stringify({
            apiVersion: 'apps/v1',
            kind:       'DaemonSet',
            metadata:   {
              name,
              namespace: ns
            },
            spec: {
              selector: { matchLabels: { app: name } },
              template: {
                metadata: { labels: { app: name } },
                spec:     { containers: [SMALL_CONTAINER] }
              }
            }
          }));
        };
      };

      cy.createManyNamespacedResources({
        context:        'daemonsets1',
        createResource: createDs(),
      })
        .then(({ ns, workloadNames }) => {
          daemonSetNamesList = workloadNames;
          nsName1 = ns;
        })
        .then(() => cy.createManyNamespacedResources({
          context:        'daemonsets2',
          createResource: createDs(uniqueDaemonSet),
          count:          1
        }))
        .then(({ ns, workloadNames }) => {
          uniqueDaemonSet = workloadNames[0];
          nsName2 = ns;

          cy.tableRowsPerPageAndNamespaceFilter(10, localCluster, 'none', `{\"local\":[\"ns://${ nsName1 }\",\"ns://${ nsName2 }\"]}`, { delay: true });
        });
    });

    it('pagination is visible and user is able to navigate through daemonsets data', () => {
      ClusterDashboardPagePo.goToAndConfirmNsValues(localCluster, { nsProject: { values: [nsName1, nsName2] } });

      WorkloadsDaemonsetsListPagePo.navTo();
      daemonSetsListPage.waitForPage();

      // The extra daemonset is created separately (daemonsets2) and can propagate slightly
      // later than the daemonsets1 batch. Wait for it to be queryable before deriving the count,
      // otherwise the API snapshot is one short of what the list renders (e.g. 23 vs 24).
      cy.waitForRancherResource('v1', 'apps.daemonset', `${ nsName2 }/${ uniqueDaemonSet }`, (resp: any) => resp?.status === 200, 30, { failOnStatusCode: false });

      // check daemonsets count
      cy.waitForStableFilteredResourceCount('v1', 'apps.daemonset', [nsName1, nsName2], { minCount: daemonSetNamesList.length + 1 }).then(() => {
        // Assert the pager against the number of resources we actually created, not the value
        // from the count read above: that server-side filtered count can lag the rows the UI
        // renders in EITHER direction (this flaked as both '23' and '24'). The retrying pager
        // assertion below waits for the UI to settle on that known total.
        const count = daemonSetNamesList.length + 1;

        // Wait for the list to finish loading so the total is settled before the single
        // (non-retrying) pagination-text assertions below.
        daemonSetsListPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();

        // pagination is visible
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .checkVisible();

        // basic checks on navigation buttons
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .rightButton()
          .isEnabled();
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .endButton()
          .isEnabled();

        // check text before navigation
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .should('contain', `1 - 10 of ${ count } DaemonSets`);

        // navigate to next page - right button
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .rightButton()
          .click();

        // check text and buttons after navigation
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`11 - 20 of ${ count } DaemonSets`);
          });
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isEnabled();
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isEnabled();

        // navigate to first page - left button
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .click();

        // check text and buttons after navigation
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } DaemonSets`);
          });
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();

        // navigate to last page - end button
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .endButton()
          .scrollIntoView()
          .click();

        // row count on last page
        let lastPageCount = count % 10;

        if (lastPageCount === 0) {
          lastPageCount = 10;
        }

        // check text after navigation
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`${ count - (lastPageCount) + 1 } - ${ count } of ${ count } DaemonSets`);
          });

        // navigate to first page - beginning button
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .click();

        // check text and buttons after navigation
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } DaemonSets`);
          });
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        daemonSetsListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
      });
    });

    it('sorting changes the order of paginated daemonsets data', () => {
      WorkloadsDaemonsetsListPagePo.navTo();
      daemonSetsListPage.waitForPage();
      // use filter to only show test data
      daemonSetsListPage.list().resourceTable().sortableTable().filter(rootResourceName);

      // check table is sorted by name in ASC order by default
      daemonSetsListPage.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(2, 'down');

      // daemonset name should be visible on first page (sorted in ASC order)
      daemonSetsListPage.list().resourceTable().sortableTable().tableHeaderRow()
        .self()
        .scrollIntoView();
      daemonSetsListPage.list().resourceTable().sortableTable().rowElementWithName(daemonSetNamesList[0])
        .scrollIntoView()
        .should('be.visible');

      // sort by name in DESC order
      daemonSetsListPage.list().resourceTable().sortableTable().sort(2)
        .click({ force: true });
      daemonSetsListPage.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(2, 'up');

      // daemonset name should be NOT visible on first page (sorted in DESC order)
      daemonSetsListPage.list().resourceTable().sortableTable().rowElementWithName(daemonSetNamesList[0])
        .should('not.exist');

      // navigate to last page
      daemonSetsListPage.list().resourceTable().sortableTable().pagination()
        .endButton()
        .scrollIntoView()
        .click();

      // daemonset name should be visible on last page (sorted in DESC order)
      daemonSetsListPage.list().resourceTable().sortableTable().rowElementWithName(daemonSetNamesList[0])
        .scrollIntoView()
        .should('be.visible');
    });

    it('filter daemonsets', () => {
      WorkloadsDaemonsetsListPagePo.navTo();
      daemonSetsListPage.waitForPage();

      daemonSetsListPage.list().resourceTable().sortableTable().checkVisible();
      daemonSetsListPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      daemonSetsListPage.list().resourceTable().sortableTable().checkRowCount(false, 10);

      // filter by name
      daemonSetsListPage.list().resourceTable().sortableTable().filter(daemonSetNamesList[0]);
      daemonSetsListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      daemonSetsListPage.list().resourceTable().sortableTable().rowElementWithName(daemonSetNamesList[0])
        .should('be.visible');

      // filter by namespace
      daemonSetsListPage.list().resourceTable().sortableTable().filter(nsName2);
      daemonSetsListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      daemonSetsListPage.list().resourceTable().sortableTable().rowElementWithName(uniqueDaemonSet)
        .should('be.visible');
    });

    it('pagination is hidden', () => {
      cy.tableRowsPerPageAndNamespaceFilter(10, localCluster, 'none', '{"local":[]}');

      // generate small set of daemonsets data
      generateDaemonSetsDataSmall();
      HomePagePo.goTo(); // this is needed here for the intercept to work
      // navTo is hardened against the workload-overview redirect to Deployments (it waits for
      // the overview's summary fetch to settle and reloads/retries if it redirected).
      WorkloadsDaemonsetsListPagePo.navTo(localCluster);
      cy.wait('@daemonSetsDataSmall');
      daemonSetsListPage.waitForPage();

      daemonSetsListPage.list().resourceTable().sortableTable().checkVisible();
      daemonSetsListPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      daemonSetsListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      daemonSetsListPage.list().resourceTable().sortableTable().pagination()
        .checkNotExists();
    });

    after('clean up', () => {
      // Ensure the default rows per page value is set after running the tests
      cy.tableRowsPerPageAndNamespaceFilter(100, localCluster, 'none', '{"local":["all://user"]}');

      // delete namespace (this will also delete all daemonsets in it)
      cy.deleteNamespace([nsName1, nsName2]);
    });
  });

  describe('Redeploy dialog', () => {
    const daemonsetName = 'daemonset-test';
    const apiResource = 'apps.daemonsets';
    const redeployEndpoint = `/v1/${ apiResource }/default/${ daemonsetName }`;
    const daemonSetsListPage = new WorkloadsDaemonsetsListPagePo(localCluster);

    const openRedeployDialog = () => {
      daemonSetsListPage.goTo();
      daemonSetsListPage.waitForPage();

      daemonSetsListPage
        .list()
        .actionMenu(daemonsetName)
        .getMenuItem('Redeploy')
        .click();

      return daemonSetsListPage
        .redeployDialog()
        .shouldBeVisible()
        .expectCancelButtonLabel('Cancel')
        .expectApplyButtonLabel('Redeploy');
    };

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
  });
});
