import RootClusterPage from '@/cypress/e2e/po/pages/root-cluster-page';
import MgmtFeatureFlagListPo from '@/cypress/e2e/po/lists/management.cattle.io.feature.po';
import CardPo from '@/cypress/e2e/po/components/card.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { EXTRA_LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

export class FeatureFlagsPagePo extends RootClusterPage {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/settings/management.cattle.io.feature`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(FeatureFlagsPagePo.createPath(clusterId));
  }

  constructor(clusterId = '_') {
    super(FeatureFlagsPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Global Settings');
    cy.contains('Feature Flags').should('be.visible');
    sideNav.navToSideMenuEntryByLabel('Feature Flags');
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
   * Get card body error
   * @param error
   * @returns
   */
  cardActionError(error: string): CypressChainable {
    const card = new CardPo();

    return card.getError().contains(error);
  }

  /**
   * Click action button
   * @param label Activate or Deactivate
   * @param endpoint
   * @param value
   * @returns
   */
  clickCardActionButtonAndWait(
    label: 'Activate' | 'Deactivate',
    endpoint: string,
    value: boolean,
    config: {
      waitForModal: boolean
      waitForRequest: boolean
    } = {
      waitForModal:   false,
      waitForRequest: true,
    }) {
    cy.intercept('PUT', `/v1/management.cattle.io.features/${ endpoint }`).as(endpoint);
    this.cardActionButton(label).click();

    if (config.waitForRequest) {
      cy.wait(`@${ endpoint }`).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body.spec).to.have.property('value', value);
        expect(response?.body.spec).to.have.property('value', value);
      });
    }

    if (config.waitForModal) {
      const card = new CardPo();

      card.checkNotExists(EXTRA_LONG_TIMEOUT_OPT);
    }
  }

  getFeatureFlag(featureFlag: string): Cypress.Chainable<Object> {
    return cy.getRancherResource('v1', 'management.cattle.io.features', featureFlag).then((r) => r.body);
  }

  setFeatureFlag(featureFlag: string, value: boolean) {
    return this.getFeatureFlag(featureFlag).then((res) => {
      const obj = {
        ...res,
        spec: { value }
      };

      cy.setRancherResource('v1', 'management.cattle.io.features', featureFlag, JSON.stringify(obj));
    });
  }
}
