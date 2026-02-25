import ComponentPo from '@/cypress/e2e/po/components/component.po';
import ScalerPo from '@/cypress/e2e/po/components/Resource/Detail/Card/scaler.po';

export default class CardPo extends ComponentPo {
  constructor(selector = '.gauges__pods') {
    super(selector);
  }

  private scaler() {
    return new ScalerPo('.plus-minus');
  }

  scaleUp(): Cypress.Chainable {
    return this.scaler().increaseButton();
  }

  scaleDown(): Cypress.Chainable {
    return this.scaler().decreaseButton();
  }

  podsRunningTotal(): Cypress.Chainable {
    return this.self().find('.count-gauge .data h1');
  }

  replicaCount(): Cypress.Chainable {
    return this.scaler().getValue();
  }

  podsStatus(): Cypress.Chainable {
    return this.self().find('.count-gauge .data label');
  }

  podsStatusCount(): Cypress.Chainable {
    return this.self().find('.count-gauge .data h1');
  }
}
