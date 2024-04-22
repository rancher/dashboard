import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberBannersPo extends EmberComponentPo {
  /**
   * Get banner content
   * @returns
   */
  bannerContent(): Cypress.Chainable {
    return this.self().find('.banner-message');
  }
}
