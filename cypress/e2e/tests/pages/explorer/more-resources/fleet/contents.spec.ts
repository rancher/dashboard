import { ContentsPagePo } from '@/cypress/e2e/po/pages/explorer/contents.po';
import { fleetContentsNoData, generateFleetContentsDataSmall } from '@/cypress/e2e/blueprints/explorer/fleet/contents-get';

const contentsPagePo = new ContentsPagePo();

describe('Contents', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    it('validate fleet contents table in empty state', () => {
      fleetContentsNoData();
      contentsPagePo.goTo();
      contentsPagePo.waitForPage();
      cy.wait('@fleetContentsNoData');

      const expectedHeaders = ['State', 'Name', 'Age'];

      contentsPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      contentsPagePo.list().resourceTable().sortableTable().checkRowCount(true, 1);
    });

    it('validate fleet contents table', () => {
      generateFleetContentsDataSmall();
      contentsPagePo.goTo();
      contentsPagePo.waitForPage();
      cy.wait('@fleetContentsDataSmall');

      // check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Age'];

      contentsPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      contentsPagePo.list().resourceTable().sortableTable().checkVisible();
      contentsPagePo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      contentsPagePo.list().resourceTable().sortableTable().noRowsShouldNotExist();
      contentsPagePo.list().resourceTable().sortableTable().checkRowCount(false, 2);
    });
  });
});
