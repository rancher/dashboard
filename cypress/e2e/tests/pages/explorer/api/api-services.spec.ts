import { APIServicesPagePo } from '@/cypress/e2e/po/pages/explorer/api-services.po';

const apiServicesPage = new APIServicesPagePo('local');

describe('Cluster Explorer', { tags: ['@explorer', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  describe('API: APIServices', () => {
    it('Should be able to use shift+j to select rows and the count of selected is correct', () => {
      apiServicesPage.goTo();
      apiServicesPage.waitForRequests();

      apiServicesPage.title().should('contain', 'APIServices');

      const sortableTable = apiServicesPage.sortableTable();
      const count = 3;

      sortableTable.rowElements().should(($els) => {
        expect($els.length).to.be.greaterThan(count - 1);
      });

      cy.keyboardControls({ shiftKey: true, key: 'j' }, count);

      sortableTable.selectedCountText().should('contain', `${ count } selected`);

      sortableTable.selectedCount().should('eq', count);
    });
  });
});
