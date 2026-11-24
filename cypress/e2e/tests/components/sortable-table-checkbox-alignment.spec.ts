import { WorkloadsPodsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';
import { SMALL_CONTAINER } from '@/cypress/e2e/tests/pages/explorer2/workloads/workload.utils';

describe('SortableTable checkbox alignment', { tags: ['@components', '@adminUser'] }, () => {
  const podsListPage = new WorkloadsPodsListPagePo('local');
  const namespace = 'default';
  let podName = '';

  beforeEach(() => {
    cy.login();
    cy.viewport(1280, 720);

    cy.createPod(namespace, 'checkbox-align', SMALL_CONTAINER.image).then((resp: any) => {
      podName = resp.body.metadata.name;
    });
  });

  afterEach(() => {
    if (podName) {
      cy.deleteRancherResource('v1', 'pods', `${ namespace }/${ podName }`, false);
    }
  });

  it('aligns row checkboxes horizontally with the header checkbox and vertically with row content', () => {
    podsListPage.goTo();
    podsListPage.waitForPage();

    const table = podsListPage.list().resourceTable().sortableTable();

    table.checkLoadingIndicatorNotVisible();
    table.rowWithName(podName).self().should('be.visible');
    table.rowCheckboxBox(0).should('be.visible');

    table.headerCheckboxBox().then(($headerBox) => {
      const headerRect = $headerBox[0].getBoundingClientRect();

      table.rowCheckboxBox(0).then(($rowBox) => {
        const rowRect = $rowBox[0].getBoundingClientRect();

        expect(Math.abs(rowRect.x - headerRect.x), 'horizontal offset vs header checkbox').to.be.at.most(0.5);

        table.rowStateBadge(0).then(($badge) => {
          const badgeRect = $badge[0].getBoundingClientRect();
          const rowCenterY = rowRect.y + (rowRect.height / 2);
          const badgeCenterY = badgeRect.y + (badgeRect.height / 2);

          expect(Math.abs(rowCenterY - badgeCenterY), 'vertical offset vs state badge').to.be.at.most(1);
        });
      });
    });
  });
});
