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

  waitForRequests() {
    FeatureFlagsPagePo.goToAndWaitForGet(this.goTo.bind(this), ['/v1/management.cattle.io.features?exclude=metadata.managedFields']);
  }

  // Get feature flags list
  list() {
    return new MgmtFeatureFlagListPo(this.self());
  }

  cardActionButton(label: string): CypressChainable {
    const card = new CardPo();

    return card.getActionButton().contains(label);
  }

  cardActionBody(label: string): CypressChainable {
    const card = new CardPo();

    return card.getBody().contains(label);
  }

  /**
   * Get banner
   * @returns
   */
  banner(): Cypress.Chainable {
    return cy.getId('fixed__banner');
  }

  /**
   * Click apply button
   * @param endpoint
   * @returns
   */
  clickCardActionButtonAndWait(label: string, endpoint: string, value: boolean): Cypress.Chainable {
    cy.intercept('PUT', `/v1/management.cattle.io.features/${ endpoint }`).as(endpoint);
    this.cardActionButton(label).click();
    cy.on('uncaught:exception', () => false);

    return cy.wait(`@${ endpoint }`).then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.spec).to.have.property('value', value);
      expect(response?.body.spec).to.have.property('value', value);
    });
  }
}
