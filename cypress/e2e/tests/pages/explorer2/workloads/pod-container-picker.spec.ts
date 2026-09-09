import { WorkloadsPodsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';
import { SMALL_CONTAINER } from '@/cypress/e2e/tests/pages/explorer2/workloads/workload.utils';
import Shell from '@/cypress/e2e/po/components/shell.po';

/**
 * https://github.com/rancher/dashboard/issues/12642
 *
 * The log and shell windows size their container picker by its content. vue-select
 * lifts the selected option out of the flow while the dropdown is open, which used
 * to collapse the picker to its min-width and drag everything right of it along.
 */
describe('Pod container picker', { tags: ['@explorer2', '@adminUser'] }, () => {
  const podsListPage = new WorkloadsPodsListPagePo('local');
  const shell = new Shell();

  // The shell test has to exec into this pod, so it needs a container that actually
  // has a shell - SMALL_CONTAINER is `pause`, which has none and never connects. The
  // loop keeps it running and gives the log window something to show.
  const SHELL_CONTAINER = {
    image:   'busybox:1.36',
    command: ['sh', '-c', 'while true; do echo "$(date) log line"; sleep 2; done'],
  };

  let podId: string;
  let manyId: string;

  const createPod = (name: string, containers: Record<string, any>[]) => {
    cy.createRancherResource('v1', 'pods', JSON.stringify({
      apiVersion: 'v1',
      kind:       'Pod',
      metadata:   { name, namespace: 'default' },
      spec:       { containers }
    }));

    // Running, not merely created: the log socket has to be able to connect, and the
    // bar re-renders when it does. The wait resolves false rather than throwing when
    // it gives up, so assert on it - otherwise a Pending pod is silently accepted.
    cy.waitForRancherResource('v1', 'pods', `default/${ name }`, (resp: any) => resp.body?.status?.phase === 'Running', 30, { failOnStatusCode: false })
      .should('eq', true);
  };

  before(() => {
    cy.login();

    // Two containers, so the window offers the picker at all, and a container name
    // long enough that a picker sized by its content is wider than its own
    // min-width. Without that the assertions below cannot fail.
    cy.createE2EResourceName('picker').then((name) => {
      podId = name;
      createPod(podId, [
        { name: 'application-server', ...SHELL_CONTAINER },
        { name: 'sidecar-log-collector', ...SHELL_CONTAINER },
      ]);
    });

    // Ten or more options flips the picker to searchable (useLabeledSelect), which
    // is the one case the fix deliberately leaves alone. This pod only ever opens the
    // log window, which connects to any container, so the light image is fine here.
    cy.createE2EResourceName('picker-many').then((name) => {
      manyId = name;
      createPod(manyId, Array.from({ length: 11 }, (_, i) => ({ name: `container-number-${ i + 1 }`, image: SMALL_CONTAINER.image })));
    });
  });

  after(() => {
    [podId, manyId].forEach((name) => {
      if (name) {
        cy.deleteRancherResource('v1', 'pods', `default/${ name }`, false);
      }
    });
  });

  const openWindow = (pod: string, action: string) => {
    podsListPage.goTo();
    podsListPage.waitForPage();

    podsListPage.list().resourceTable().sortableTable()
      .rowActionMenuOpen(pod)
      .getMenuItem(action)
      .click();

    // The drawer animates open and the bar re-renders as the socket resolves. Both
    // windows paint "Disconnected" on first render, so wait for the connected state
    // specifically - "contain" is case sensitive, so "Disconnected" does not match it.
    shell.connectionStatus().should('contain', 'Connected');
    shell.containerPicker().should('be.visible');
  };

  /**
   * Open the picker, then close it, asserting that neither it nor the element
   * beside it moves at any point.
   */
  const expectNothingMoves = (neighbour: () => Cypress.Chainable) => {
    shell.containerPicker().invoke('outerWidth').then((closedWidth: number) => {
      // A picker sized by its content has to start out wider than its own min-width,
      // or it has nothing to collapse to and these assertions pass either way.
      expect(closedWidth).to.be.greaterThan(200);

      neighbour().invoke('offset').its('left').then((closedLeft: number) => {
        shell.containerPicker().click();
        cy.get('.vs__dropdown-menu').should('be.visible');

        shell.containerPicker().invoke('outerWidth').should('be.closeTo', closedWidth, 1);
        neighbour().invoke('offset').its('left').should('be.closeTo', closedLeft, 1);

        shell.containerPicker().click();
        cy.get('.vs__dropdown-menu').should('not.exist');

        shell.containerPicker().invoke('outerWidth').should('be.closeTo', closedWidth, 1);
        neighbour().invoke('offset').its('left').should('be.closeTo', closedLeft, 1);
      });
    });
  };

  beforeEach(() => {
    // The bar has to be wide enough that a content-sized picker is wider than its
    // own min-width, which is what the assertions rely on.
    cy.viewport(1440, 900);
  });

  it('should not move the log window picker or the buttons beside it when the dropdown opens', () => {
    openWindow(podId, 'View Logs');

    expectNothingMoves(() => shell.logActionGroup());
  });

  it('should not move the shell window picker or the status beside it when the dropdown opens', () => {
    openWindow(podId, 'Execute Shell');

    expectNothingMoves(() => shell.connectionStatus());
  });

  it('should leave a searchable picker alone, so the search input still covers the value', () => {
    openWindow(manyId, 'View Logs');

    // This pins current behaviour, not desired behaviour: ten or more containers is
    // still the #12642 symptom, and the honest fix is a min-width on the searching
    // state rather than this guard. See the follow-up issue linked from #12642.
    //
    // Until then it guards the `:not(.vs--unsearchable)` half of the fix, stated in
    // that half's own terms - `vs--unsearchable` is set whenever `searchable` is
    // false, whereas `vs--searchable` also depends on `noDrop`, so only the absence
    // of the former is exactly the stylesheet's condition. Dropping the guard would
    // silently change every searchable select in the product, and the two tests
    // above would still pass.
    shell.containerPicker().find('.v-select').should('not.have.class', 'vs--unsearchable');

    shell.containerPicker().invoke('outerWidth').then((closedWidth: number) => {
      expect(closedWidth).to.be.greaterThan(200);

      shell.logActionGroup().invoke('offset').its('left').then((closedLeft: number) => {
        shell.containerPicker().click();
        cy.get('.vs__dropdown-menu').should('be.visible');

        // A searchable select lifts the value out of the flow on purpose, so that the
        // search input can sit on top of it. Both still move, and that is the point.
        shell.containerPicker().invoke('outerWidth').should('be.lessThan', closedWidth);
        shell.logActionGroup().invoke('offset').its('left').should('be.lessThan', closedLeft);

        shell.containerPicker().find('.vs__search').invoke('offset').its('left')
          .then((searchLeft: number) => {
            shell.containerPicker().find('.vs__selected').invoke('offset').its('left')
              .should('be.closeTo', searchLeft, 1);
          });
      });
    });
  });
});
