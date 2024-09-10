import ComponentPo from '@/cypress/e2e/po/components/component.po';

export class MonitoringTab extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  // Scroll to bottom of tab view
  scrollToTabBottom() {
    cy.get('.main-layout > .outlet > .outer-container').scrollTo('bottom');
  }
}
