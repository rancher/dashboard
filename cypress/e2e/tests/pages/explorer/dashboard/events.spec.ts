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
  setupCount: (vaiCacheEnabled: boolean, initialCount: number) => {
    if (vaiCacheEnabled) {
      cy.intercept('GET', '/v1/events?*').as('getCount');
    } else {
      cy.wrap(initialCount).as('count');
    }
  },
  handleCount: (vaiCacheEnabled) => {
    if (vaiCacheEnabled) {
      cy.wait('@getCount').then((interception) => {
        cy.wrap(interception.response.body.count).as('count');
      });
    }
  },
  getCount: () => cy.get('@count').then((count) => count as any as number),
};

describe('Events', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@noVai', '@adminUser'] }, () => {
    let uniquePod = SortableTablePo.firstByDefaultName('pod');
    let nsName1: string;
    let nsName2: string;

    before('set up', () => {
      cy.tableRowsPerPageAndPreferences(pageSize, {
        clusterName:     cluster,
        groupBy:         'none',
        namespaceFilter: '{\"local\":[]}',
        allNamespaces:   'true',
      });

      const createPod = (podName?: string) => {
        return ({ ns, i }: {ns: string, i: number}) => {
          const name = podName || Cypress._.uniqueId(`${ Date.now().toString() }-${ i }`);

          return cy.createPod(ns, name, SMALL_CONTAINER.image, false, { createNameOptions: { prefixContext: true } });
        };
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
        });

      // I'm loathed to do this, but the events created from the pods need to settle before we start
      cy.wait(20000); // eslint-disable-line cypress/no-unnecessary-waiting
    });

    it('pagination is visible and user is able to navigate through events data', () => {
      ClusterDashboardPagePo.goToAndConfirmNsValues(cluster, { all: { is: true } });

      clusterDashboard.waitForPage(undefined, 'cluster-events');
      EventsPageListPo.navTo();
      events.waitForPage();

      let vaiCacheEnabled = false;

      cy.isVaiCacheEnabled()
        .then((isVaiCacheEnabled) => {
          vaiCacheEnabled = isVaiCacheEnabled;

          return cy.getRancherResource('v1', 'events');
        })
        .then((resp: Cypress.Response<any>) => {
          let initialCount = resp.body.count;

          if (!vaiCacheEnabled && resp.body.count > 500) {
            // Why 500? there's a hardcoded figure to stops ui from storing more than 500 events ...
            initialCount = 500;
          }

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

          // check text before navigation
          events.list().resourceTable().sortableTable().pagination()
            .self()
            .scrollIntoView();
          events.list().resourceTable().sortableTable().pagination()
            .paginationText()
            .then((el) => {
              expect(el.trim()).to.eq(`1 - ${ pageSize } of ${ initialCount } Events`);
            });

          // navigate to next page - right button
          countHelper.setupCount(vaiCacheEnabled, initialCount);
          events.list().resourceTable().sortableTable().pagination()
            .rightButton()
            .click();
          countHelper.handleCount(vaiCacheEnabled);

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
          countHelper.setupCount(vaiCacheEnabled, initialCount);
          events.list().resourceTable().sortableTable().pagination()
            .leftButton()
            .click();
          countHelper.handleCount(vaiCacheEnabled);

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
          countHelper.setupCount(vaiCacheEnabled, initialCount);
          events.list().resourceTable().sortableTable().pagination()
            .endButton()
            .scrollIntoView()
            .click();
          countHelper.handleCount(vaiCacheEnabled);

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
          countHelper.setupCount(vaiCacheEnabled, initialCount);
          events.list().resourceTable().sortableTable().pagination()
            .beginningButton()
            .click();
          countHelper.handleCount(vaiCacheEnabled);

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
