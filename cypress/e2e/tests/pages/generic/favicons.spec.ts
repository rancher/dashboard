import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';

describe('Global UI', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
  describe('Favicons', () => {
    beforeEach(() => {
      LoginPagePo.goTo();
    });

    it('Should display png favicon', () => {
      cy.get('head link[rel="shortcut icon"]')
        .should('have.attr', 'href', '/favicon.png');
    });

    it('Should have correct set of favicons', () => {
      cy.get('head link[rel="shortcut icon"]')
        .should('have.attr', 'href', '/favicon.png');

      cy.fixture('global/favicons/favicon.png', 'base64').then((expectedBase64) => {
        cy.requestBase64Image('/favicon.png').then((base64Icon) => {
          expect(expectedBase64).to.eq(base64Icon);
        });
      });

      cy.fixture('global/favicons/favicon.png', 'base64').then((expectedBase64) => {
        cy.requestBase64Image('/favicon.png').then((base64Icon) => {
          expect(expectedBase64).to.eq(base64Icon);
        });
      });
    });
  });
});
