import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ReleaseWelcomeDialogPo extends ComponentPo {
  constructor() {
    super('[data-testid="release-welcome"]');
  }

  title() {
    return this.self().find('[data-testid="release-welcome-title"]');
  }

  loading() {
    return this.self().find('[data-testid="release-welcome-loading"]');
  }

  whatsNew() {
    return cy.get('[data-testid="release-welcome-whats-new"]');
  }

  whatsNewVersion() {
    return this.whatsNew().find('[data-testid="release-welcome-version"]');
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
