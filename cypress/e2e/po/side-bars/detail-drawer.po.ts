import ComponentPo from '@/cypress/e2e/po/components/component.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
export default class DetailDrawer extends ComponentPo {
  constructor() {
    super('[data-testid="slide-in-panel-component"]');
  }

  waitforContent() {
    return this.self().find('.explain-panel').should('be.visible').within(() => {
      cy.get('.icon-spinner').should('not.exist');
      cy.get('.markdown').should('be.visible');
    });
  }

  tabs() {
    return new TabbedPo('.dashboard-root', 'configuration-drawer-tabbed');
  }

  saveButton() {
    return this.self().get('[data-testid="save-configuration-bttn"');
  }

  closeButton() {
    return this.self().get('[data-testid="slide-in-panel-close-resource-explain"');
  }
}
