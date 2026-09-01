import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { EventsPageListPo } from '@/cypress/e2e/po/pages/explorer/events.po';
import { generateEventsDataSmall } from '@/cypress/e2e/blueprints/explorer/cluster/events';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
import { SMALL_CONTAINER } from '@/cypress/e2e/tests/pages/explorer2/workloads/workload.utils';

const cluster = 'local';
const clusterDashboard = new ClusterDashboardPagePo(cluster);
const events = new EventsPageListPo(cluster);
const pageSize = 10;
// Should be enough to create at least 3 pages of events
const podCount = 15;

const countHelper = {
  setupCount: () => {
    cy.intercept('GET', '/v1/events?*').as('getCount');
  },
  handleCount: () => {
    cy.wait('@getCount').then((interception) => {
      cy.wrap(interception.response.body.count).as('count');
    });
  },
  getCount: () => cy.get('@count').then((count) => count as any as number),
};

describe('Events', { testIsolation: false, tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@adminUser'] }, () => {
    let uniquePod = SortableTablePo.firstByDefaultName('pod');
    let nsName1: string;
    let nsName2: string;

    before('set up', () => {
      cy.tableRowsPerPageAndPreferences(pageSize, {
        clusterName:     cluster,
        groupBy:         'none',
        namespaceFilter: '{\"local\":[]}',
        allNamespaces:   'true',
      }, { delay: true });

      const createPod = (podName?: string) => {
        return ({ ns, i }: {ns: string, i: number}) => {
          const name = podName || Cypress._.uniqueId(`${ Date.now().toString() }-${ i }`);

          return cy.createPod(ns, name, SMALL_CONTAINER.image, false, { createNameOptions: { prefixContext: true } });
        };
      };

      // k8s events are emitted (scheduler/kubelet/event-recorder) and indexed into /v1/events
      // asynchronously. A fixed wait races that latency and, under the load of creating many pods at
      // once, intermittently let the tests query before the unique pod's event had propagated - so the
      // event "did not exist" yet. Poll until the unique pod's event actually exists before starting,
      // instead of blindly waiting a fixed time (the event's id/name embeds the pod name).
      const waitForUniquePodEvent = (retries = 30): void => {
        cy.request({
          method:           'GET',
          url:              `${ Cypress.env('api') }/v1/events?filter=metadata.namespace=${ nsName2 }`,
          failOnStatusCode: false,
        }).then((resp) => {
          const hasEvent = resp.status === 200 && (resp.body?.data || []).some(
            (e: any) => `${ e.id || '' }|${ e.metadata?.name || '' }`.includes(uniquePod)
          );

          if (hasEvent || retries === 0) {
            return;
          }

          cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting

          waitForUniquePodEvent(retries - 1);
        });
      };

      cy.createManyNamespacedResources({
        context:        'events1',
        createResource: createPod(),
        count:          podCount,
      })
        .then(({ ns }) => {
          nsName1 = ns;
        })
        .then(() => cy.createManyNamespacedResources({
          context:        'events2',
          createResource: createPod(uniquePod),
          count:          1
        }))
        .then(({ ns, workloadNames }) => {
          uniquePod = workloadNames[0];
          nsName2 = ns;
        })
        .then(() => waitForUniquePodEvent());
    });

    it('pagination is visible and user is able to navigate through events data', () => {
      ClusterDashboardPagePo.goToAndConfirmNsValues(cluster, { all: { is: true } });

      clusterDashboard.waitForPage(undefined, 'cluster-events');
      // Capture the count from the list's OWN request. Events churn constantly (they GC/expire),
      // so a separately-read API count can already disagree with what the list rendered.
      countHelper.setupCount();
      EventsPageListPo.navTo();
      events.waitForPage();
      countHelper.handleCount();

      cy.getRancherResource('v1', 'events')
        .then((resp: Cypress.Response<any>) => {
          const initialCount = resp.body.count;

          // Test break down if less than 3 pages...
          expect(initialCount).to.be.greaterThan(3 * pageSize);

          // pagination is visible
          events.list().resourceTable().sortableTable().pagination()
            .checkVisible();

          const loadingPo = new LoadingPo('.title .resource-loading-indicator');

          loadingPo.checkNotExists();

          // basic checks on navigation buttons
          events.list().resourceTable().sortableTable().pagination()
            .beginningButton()
            .isDisabled();
          events.list().resourceTable().sortableTable().pagination()
            .leftButton()
            .isDisabled();
          events.list().resourceTable().sortableTable().pagination()
            .rightButton()
            .isEnabled();
          events.list().resourceTable().sortableTable().pagination()
            .endButton()
            .isEnabled();

          // check text before navigation - assert against the count the list actually rendered
          // (initialCount from the separate API read above can already be stale for volatile events).
          events.list().resourceTable().sortableTable().pagination()
            .self()
            .scrollIntoView();
          countHelper.getCount().then((count) => {
            return events.list().resourceTable().sortableTable().pagination()
              .paginationText()
              .then((el) => {
                expect(el.trim()).to.eq(`1 - ${ pageSize } of ${ count } Events`);
              });
          });

          // navigate to next page - right button
          countHelper.setupCount();
          events.list().resourceTable().sortableTable().pagination()
            .rightButton()
            .click();
          countHelper.handleCount();

          // check text and buttons after navigation
          events.list().resourceTable().sortableTable().pagination()
            .self()
            .scrollIntoView();
          countHelper.getCount().then((count) => {
            return events.list().resourceTable().sortableTable().pagination()
              .paginationText()
              .then((el) => {
                expect(el.trim()).to.eq(`${ pageSize + 1 } - ${ 2 * pageSize } of ${ count } Events`);
              });
          });
          events.list().resourceTable().sortableTable().pagination()
            .beginningButton()
            .isEnabled();
          events.list().resourceTable().sortableTable().pagination()
            .leftButton()
            .isEnabled();

          // navigate to first page - left button
          countHelper.setupCount();
          events.list().resourceTable().sortableTable().pagination()
            .leftButton()
            .click();
          countHelper.handleCount();

          // check text and buttons after navigation
          events.list().resourceTable().sortableTable().pagination()
            .self()
            .scrollIntoView();
          countHelper.getCount().then((count) => {
            return events.list().resourceTable().sortableTable().pagination()
              .paginationText()
              .then((el) => {
                expect(el.trim()).to.eq(`1 - ${ pageSize } of ${ count } Events`);
              });
          });

          events.list().resourceTable().sortableTable().pagination()
            .beginningButton()
            .isDisabled();
          events.list().resourceTable().sortableTable().pagination()
            .leftButton()
            .isDisabled();

          // navigate to last page - end button
          countHelper.setupCount();
          events.list().resourceTable().sortableTable().pagination()
            .endButton()
            .scrollIntoView()
            .click();
          countHelper.handleCount();

          // check text after navigation
          events.list().resourceTable().sortableTable().pagination()
            .self()
            .scrollIntoView();
          countHelper.getCount().then((count) => {
            return events.list().resourceTable().sortableTable().pagination()
              .paginationText()
              .then((el) => {
                let pages = Math.floor(count / pageSize);

                if (count % pageSize === 0) {
                  pages--;
                }
                const from = (pages * pageSize) + 1;
                const to = count;

                expect(el.trim()).to.eq(`${ from } - ${ to } of ${ to } Events`);
              });
          });

          // navigate to first page - beginning button
          countHelper.setupCount();
          events.list().resourceTable().sortableTable().pagination()
            .beginningButton()
            .click();
          countHelper.handleCount();

          // check text and buttons after navigation
          events.list().resourceTable().sortableTable().pagination()
            .self()
            .scrollIntoView();
          countHelper.getCount().then((count) => {
            events.list().resourceTable().sortableTable().pagination()
              .paginationText()
              .then((el) => {
                expect(el.trim()).to.eq(`1 - ${ pageSize } of ${ count } Events`);
              });
          });

          events.list().resourceTable().sortableTable().pagination()
            .beginningButton()
            .isDisabled();
          events.list().resourceTable().sortableTable().pagination()
            .leftButton()
            .isDisabled();
        });
    });

    it('filter events', () => {
      ClusterDashboardPagePo.navTo();
      clusterDashboard.waitForPage(undefined, 'cluster-events');
      EventsPageListPo.navTo();
      events.waitForPage();

      events.list().resourceTable().sortableTable().checkVisible();
      events.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      events.list().resourceTable().sortableTable().checkRowCount(false, pageSize);

      // filter by namespace
      events.list().resourceTable().sortableTable().filter(nsName2);
      events.waitForPage(`q=${ nsName2 }`);
      events.list().resourceTable().sortableTable().rowElementWithPartialName(uniquePod)
        .should('have.length.lte', 5);
      events.list().resourceTable().sortableTable().rowElementWithPartialName(uniquePod)
        .should('be.visible');

      // filter by name
      events.list().resourceTable().sortableTable().filter(uniquePod);
      events.waitForPage(`q=${ uniquePod }`);
      events.list().resourceTable().sortableTable().rowElementWithPartialName(uniquePod)
        .should('have.length.lte', 5);
      events.list().resourceTable().sortableTable().rowElementWithPartialName(uniquePod)
        .should('be.visible');

      events.list().resourceTable().sortableTable().resetFilter();
    });

    it('sorting changes the order of paginated events data', () => {
      EventsPageListPo.navTo();
      events.waitForPage();

      // check table is sorted by `last seen` in ASC order by default
      events.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(2, 'down');

      // sort by name in ASC order
      events.list().resourceTable().sortableTable().sort(11)
        .click();
      events.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(11, 'down');

      // event name should be visible on first page (sorted in ASC order)
      events.list().resourceTable().sortableTable().tableHeaderRow()
        .self()
        .scrollIntoView();
      events.list().resourceTable().sortableTable().rowElementWithPartialName(uniquePod)
        .scrollIntoView()
        .should('be.visible');

      // sort by name in DESC order
      events.list().resourceTable().sortableTable().sort(11)
        .click();
      events.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(11, 'up');

      // event name should be NOT visible on first page (sorted in DESC order)
      events.list().resourceTable().sortableTable().rowElementWithPartialName(uniquePod)
        .should('not.exist');

      // navigate to last page
      events.list().resourceTable().sortableTable().pagination()
        .endButton()
        .scrollIntoView()
        .click();

      // event name should be visible on last page (sorted in DESC order)
      events.list().resourceTable().sortableTable().rowElementWithPartialName(uniquePod)
        .scrollIntoView()
        .should('be.visible');
    });

    it('pagination is hidden', () => {
      // generate small set of events data
      generateEventsDataSmall();
      events.goTo();
      events.waitForPage();
      cy.wait('@eventsDataSmall');

      events.list().resourceTable().sortableTable().checkVisible();
      events.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      events.list().resourceTable().sortableTable().checkRowCount(false, 3);
      events.list().resourceTable().sortableTable().pagination()
        .checkNotExists();
    });

    after('clean up', () => {
      cy.tableRowsPerPageAndPreferences(100, {
        clusterName:     cluster,
        groupBy:         'none',
        namespaceFilter: '{"local":["all://user"]}',
        allNamespaces:   'false',
      });

      // delete namespace (this will also delete all pods in it)
      cy.deleteNamespace([nsName1, nsName2]);
    });
  });
});
