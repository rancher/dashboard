import RootClusterPage from '@/cypress/e2e/po/pages/root-cluster-page';
import MgmtFeatureFlagListPo from '@/cypress/e2e/po/lists/management.cattle.io.feature.po';
import CardPo from '@/cypress/e2e/po/components/card.po';
import { CypressChainable } from '~/cypress/e2e/po/po.types';

export class FeatureFlagsPagePo extends RootClusterPage {
  static url = '/c/_/settings/management.cattle.io.feature';
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(FeatureFlagsPagePo.url);
  }

  constructor() {
    super(FeatureFlagsPagePo.url);
  }

  // Get feature flags list
  list() {
    return new MgmtFeatureFlagListPo(this.self());
  }

  /**
   * Get card action button
   * @param label
   * @returns
   */
  cardActionButton(label: string): CypressChainable {
    const card = new CardPo();

    return card.getActionButton().contains(label);
  }

  /**
   * Get card body
   * @param label
   * @returns
   */
  cardActionBody(label: string): CypressChainable {
    const card = new CardPo();

    return card.getBody().contains(label);
  }

  /**
   * Click action button
   * @param label Activate or Deactivate
   * @param endpoint
   * @param value
   * @returns
   */
  clickCardActionButtonAndWait(label: 'Activate' | 'Deactivate', endpoint: string, value: boolean): Cypress.Chainable {
    cy.intercept('PUT', `/v1/management.cattle.io.features/${ endpoint }`).as(endpoint);
    this.cardActionButton(label).click();

    return cy.wait(`@${ endpoint }`).then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.spec).to.have.property('value', value);
      expect(response?.body.spec).to.have.property('value', value);
    });
  }
}
