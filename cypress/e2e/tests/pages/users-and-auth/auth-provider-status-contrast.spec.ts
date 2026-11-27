import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { AuthProviderPo } from '@/cypress/e2e/po/pages/users-and-auth/authProvider.po';
import { textContrast } from '@/cypress/support/utils/color-contrast';

const WCAG_AA_TEXT = 4.5;
const TRANSPARENT = 'rgba(0, 0, 0, 0)';

const authProviderPo = new AuthProviderPo('_');

function showThemeWithoutSaving(theme: 'light' | 'dark') {
  cy.intercept('GET', '/v1/userpreferences*', (req) => {
    req.on('before:response', (res) => {
      const prefs = res.body?.data?.[0]?.data;

      if (prefs) {
        prefs.theme = JSON.stringify(`ui-${ theme }`);
      }
    });
  });
  cy.intercept('PUT', '/v1/userpreferences/*', (req) => req.reply({ statusCode: 200, body: req.body }));
}

function expectReadable(badge: HTMLElement) {
  expect(textContrast(badge), `contrast of the "${ badge.textContent?.trim() }" badge`).to.be.at.least(WCAG_AA_TEXT);
}

describe('Auth Provider status badges', { tags: ['@usersAndAuths', '@adminUser'] }, () => {
  (['dark', 'light'] as const).forEach((theme) => {
    describe(`in the ${ theme } theme`, () => {
      beforeEach(() => {
        cy.login();
        showThemeWithoutSaving(theme);
        HomePagePo.goToAndWaitForGet();
        AuthProviderPo.navTo();
        authProviderPo.waitForUrlPathWithoutContext();
        cy.get('body').should('have.class', `theme-${ theme }`);
      });

      it('keeps every status badge readable at rest', () => {
        authProviderPo.title().realHover({ scrollBehavior: false });
        authProviderPo.providerRows().should(($rows) => {
          expect($rows.toArray().filter((row) => row.matches(':hover')), 'hovered rows').to.have.length(0);
        });

        authProviderPo.statusBadges().should(($badges) => {
          expect($badges.filter('.none'), 'Inactive badges').to.have.length.greaterThan(0);
          $badges.each((_, badge) => expectReadable(badge));
        });
      });

      it('keeps an Inactive badge readable on a hovered row', () => {
        authProviderPo.inactiveProviderRow().as('row');

        cy.get('@row').find('.auth-provider-row__title').realHover({ scrollBehavior: false });

        cy.get('@row').should(($row) => {
          expect($row[0].matches(':hover'), 'the Inactive row is hovered').to.equal(true);
          expect($row.css('background-color'), 'hovered row background').not.to.equal(TRANSPARENT);
          expectReadable($row.find('.rc-status-badge')[0]);
        });
      });
    });
  });
});
