/* eslint-disable cypress/no-unnecessary-waiting */
import { ChartsPage } from '@/cypress/e2e/po/pages/charts.po';
import { gatekeeperSchemas } from '@/cypress/e2e/blueprints/schemas/opa-gatekeeper.js';
import OpaGatekeeperPo from '@/cypress/e2e/po/other-products/opa-gatekeeper';

function reply(statusCode: number, body: any): any {
  return (req: any) => {
    req.reply({
      statusCode,
      body
    });
  };
}

describe('Charts', { tags: ['@charts', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  describe('OPA Gatekeeper resources', () => {
    it('should check conditions related to issue #4600 (template w/ create btn + edit constraints w/ save btn)', () => {
      // all intercepts needed to mock install of OPA-Gatekeeper
      cy.intercept('GET', `/v1/schemas?*`, (req) => {
        req.continue((res) => {
          const schemaData = [...res.body.data, ...gatekeeperSchemas];

          res.body.data = schemaData;
          res.send(res.body);
        });
      }).as('v1Schemas');

      cy.intercept('GET', `/k8s/clusters/local/v1/schemas?*`, (req) => {
        req.continue((res) => {
          const schemaData = [...res.body.data, ...gatekeeperSchemas];

          res.body.data = schemaData;
          res.send(res.body);
        });
      }).as('k8sSchemas');

      cy.intercept('GET', `/v1/constraints.gatekeeper.sh.constraints?*`,
        reply(200,
          {
            type:         'collection',
            links:        { self: 'https://localhost:8005/v1/templates.gatekeeper.sh.constraints' },
            createTypes:  { 'templates.gatekeeper.sh.constraint': 'https://localhost:8005/v1/templates.gatekeeper.sh.constraints' },
            actions:      {},
            resourceType: 'templates.gatekeeper.sh.constraint',
            revision:     '17263066',
            count:        0,
            data:         []
          })).as('constraint');

      cy.intercept('GET', `/v1/templates.gatekeeper.sh.constrainttemplates?*`,
        reply(200,
          {
            type:         'collection',
            links:        { self: 'https://localhost:8005/v1/templates.gatekeeper.sh.constrainttemplates' },
            createTypes:  { 'templates.gatekeeper.sh.constrainttemplate': 'https://localhost:8005/v1/templates.gatekeeper.sh.constrainttemplates' },
            actions:      {},
            resourceType: 'templates.gatekeeper.sh.constrainttemplate',
            revision:     '17263066',
            count:        0,
            data:         []
          })).as('constraintTemplates');

      const opaGatekeeper = new OpaGatekeeperPo('local');

      opaGatekeeper.goTo();
      opaGatekeeper.waitForPage();

      opaGatekeeper.navToSideMenuEntryByLabel('Template');
      opaGatekeeper.waitForPage();

      opaGatekeeper.createFromYaml().should('exist');

      opaGatekeeper.navToSideMenuEntryByLabel('Constraints');
      opaGatekeeper.waitForPage();

      opaGatekeeper.create().click();
      opaGatekeeper.waitForPage();

      opaGatekeeper.saveCreateForm().expectToBeEnabled();
    });
  });

  describe('OPA Gatekeeper install', () => {
    const chartsPageUrl = '/c/local/apps/charts/chart?repo-type=cluster&repo=rancher-charts';
    const chartVersion = '102.1.0%2Bup3.12.0';
    const opaGatekeeperPage = `${ chartsPageUrl }&chart=rancher-gatekeeper&${ chartVersion }`;

    const chartsPage: ChartsPage = new ChartsPage(opaGatekeeperPage);

    beforeEach(() => {
      chartsPage.goTo();
    });

    describe('YAML view', () => {
      beforeEach(() => {
        chartsPage.goToInstall().nextPage();
        chartsPage.editYaml();
      });

      describe('UI Elements', () => {
        it('Footer controls should sticky to bottom', () => {
          cy.get('#wizard-footer-controls').should('be.visible');

          cy.get('#wizard-footer-controls').then(($el) => {
            const elementRect = $el[0].getBoundingClientRect();
            const viewportHeight = Cypress.config('viewportHeight');
            const pageHeight = Cypress.$(cy.state('window')).height();

            expect(elementRect.bottom).to.eq(pageHeight);
            expect(elementRect.bottom).to.eq(viewportHeight);
          });
        });
      });
    });
  });
});
