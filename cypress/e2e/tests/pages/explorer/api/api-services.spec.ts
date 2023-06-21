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
      apiServicesPage.mastheadTitle().should('contain', 'APIServices');
    });

    it('Should be able to use shift+j to select corre', () => {
      // Wait for the page to load with all the rows.
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.get('.main-layout').wait(1000).click();

      const sortableTable = apiServicesPage.resourcesList().resourceTable().sortableTable();

      sortableTable.rowElements().its('length').then((count: number) => {

        cy.keyboardControls({ shiftKey: true, key: 'j' }, count + 2);

        sortableTable.selectedCountText().should('contain', `${ count } selected`);

        sortableTable.selectedCount().should('eq', count);
      });
    });
  });
});
