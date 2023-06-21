import { APIServicesPagePo } from '@/cypress/e2e/po/pages/explorer/api-services.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';

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
      cy.get('.main-layout').wait(1000).click();

      const sortableTable = new SortableTablePo('.sortable-table');

      sortableTable.rowElements().its('length').then((count: number) => {
        const overCount = count + 2;
        cy.keyboardControls({ shiftKey: true, key: 'j' }, overCount);
   
        sortableTable.selectedCountText().should('contain', `${ count } selected`);

        sortableTable.selectedCount().should('eq', count);
   
      });   
    });
  });
});
