import { APIServicesPagePo } from '@/cypress/e2e/po/pages/explorer/api-services.po';

describe('Cluster Explorer', { tags: ['@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  describe('API: APIServices', () => {
    let apiServicesPage: APIServicesPagePo;

    beforeEach(() => {
      apiServicesPage = new APIServicesPagePo('local');
      apiServicesPage.goTo();
      apiServicesPage.waitForRequests();
    });

    it('Should be able to use shift+j to select rows and the count of selected is correct', () => {
      apiServicesPage.title().should('contain', 'APIServices');

      const sortableTable = apiServicesPage.sortableTable();

      sortableTable.rowElements().its('length').then((count: number) => {
        cy.keyboardControls({ shiftKey: true, key: 'j' }, count + 2);

        sortableTable.selectedCountText().should('contain', `${ count } selected`);

        sortableTable.selectedCount().should('eq', count);
      });
    });
  });
});
