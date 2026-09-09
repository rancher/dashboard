import { WorkloadsPodsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';
import { SMALL_CONTAINER } from '@/cypress/e2e/tests/pages/explorer2/workloads/workload.utils';
import Shell from '@/cypress/e2e/po/components/shell.po';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

describe('Pod container picker', { tags: ['@explorer2', '@adminUser'] }, () => {
  const podsListPage = new WorkloadsPodsListPagePo('local');
  const shell = new Shell();

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

    cy.waitForRancherResource('v1', 'pods', `default/${ name }`, (resp: any) => resp.body?.status?.phase === 'Running', 30, { failOnStatusCode: false })
      .should('eq', true);
  };

  before(() => {
    cy.login();

    cy.createE2EResourceName('picker-two').then((name) => {
      podId = name;
      createPod(podId, [
        { name: 'application-server', ...SHELL_CONTAINER },
        { name: 'sidecar-log-collector', ...SHELL_CONTAINER },
      ]);
    });

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
    podsListPage.list().checkVisible(LONG_TIMEOUT_OPT);

    const table = podsListPage.list().resourceTable().sortableTable();

    table.checkLoadingIndicatorNotVisible();
    table.filter(pod);
    table.rowWithName(pod).checkExists();

    table.rowActionMenuOpen(pod)
      .getMenuItem(action)
      .click();

    shell.connectionStatus(LONG_TIMEOUT_OPT).should('contain', 'Connected');
    shell.containerPicker().should('be.visible');
  };

  const expectNothingMoves = (neighbour: () => Cypress.Chainable) => {
    shell.containerPicker().invoke('outerWidth').then((closedWidth: number) => {
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
    cy.login();
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

    shell.containerPicker().find('.v-select').should('not.have.class', 'vs--unsearchable');

    shell.containerPicker().invoke('outerWidth').then((closedWidth: number) => {
      expect(closedWidth).to.be.greaterThan(200);

      shell.logActionGroup().invoke('offset').its('left').then((closedLeft: number) => {
        shell.containerPicker().click();
        cy.get('.vs__dropdown-menu').should('be.visible');

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
