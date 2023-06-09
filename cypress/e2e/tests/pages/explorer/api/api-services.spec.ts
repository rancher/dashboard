import { APIServicesPagePo } from '@/cypress/e2e/po/pages/explorer/api-services.po';

describe('Cluster Explorer', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('API: APIServices', () => {
    let apiServicesPage: APIServicesPagePo;

    beforeEach(() => {
      apiServicesPage = new APIServicesPagePo('local');
      apiServicesPage.goTo();
    });

    it('Should have a title', () => {
      cy.get('h1').should('contain', 'APIServices');
    });

    it('Should be able to use shift+j to select corre', () => {
      cy.get('.main-layout').click();

      const count = 4;

      cy.keyboardControls({ shiftKey: true, key: 'j' }, 4);

      cy.get('#selected-count').should('contain', `${ count } selected`);

      cy.get('.sortable-table tbody input[type="checkbox"]:checked')
        .its('length').should('eq', count);
    });
  });
});
