import { IngressPagePo } from '@/cypress/e2e/po/pages/explorer/ingress.po';

const ingressPagePo = new IngressPagePo();

describe('ConfigMap', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('does not show console warning due to lack of secondary schemas needed to load data on list view', () => {
    // pattern as per https://docs.cypress.io/faq/questions/using-cypress-faq#How-do-I-spy-on-consolelog
    cy.visit(ingressPagePo.urlPath(), {
      onBeforeLoad(win) {
        cy.stub(win.console, 'warn').as('consoleWarn');
      },
    });

    cy.title().should('eq', 'Rancher - local - Ingresses');

    const warnMsg = "pathExistsInSchema requires schema networking.k8s.io.ingress to have resources fields via schema definition but none were found. has the schema 'fetchResourceFields' been called?";

    // testing https://github.com/rancher/dashboard/issues/11086
    cy.get('@consoleWarn').should('not.be.calledWith', warnMsg);
  });
});
