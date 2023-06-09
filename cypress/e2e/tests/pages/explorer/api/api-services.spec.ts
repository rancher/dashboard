import { APIServicesPagePo } from '@/cypress/e2e/po/pages/explorer/api-services.po';
import ResourceTablePo from '~/cypress/e2e/po/components/resource-table.po';
import SortableTablePo from '~/cypress/e2e/po/components/sortable-table.po';

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

            const sortableTable = new SortableTablePo('.sortable-table');
            const count = 4;

            cy.keyboardControls({ shiftKey: true, key: 'j' }, 4);

            sortableTable.selectedCountText().should('contain', `${count} selected`);

            sortableTable.selectedCount().should('eq', count);
        });
    });
});
