import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ReleaseWelcomeDialogPo extends ComponentPo {
  constructor() {
    // The ModalManager replaces the dialog's own test id, so find it by class
    super('.release-welcome');
  }

  title() {
    return this.self().find('[data-modal-title]');
  }

  whatsNew() {
    return cy.get('[data-testid="release-welcome-whats-new"]');
  }

  whatsNewFeatures() {
    return this.whatsNew().find('[data-testid^="release-welcome-feature-"]');
  }

  primePromo() {
    return cy.get('[data-testid="release-welcome-prime"]');
  }

  primePromoExplore() {
    return cy.get('[data-testid="release-welcome-prime-explore"]');
  }

  closeButton() {
    return cy.get('[data-testid="release-welcome-close"]');
  }

  goToDashboardButton() {
    return cy.get('[data-testid="release-welcome-go-to-dashboard"]');
  }
}
