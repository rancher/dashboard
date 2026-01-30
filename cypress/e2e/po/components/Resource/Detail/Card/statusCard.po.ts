import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';
import ScalerPo from '@/cypress/e2e/po/components/Resource/Detail/Card/scaler.po';

export default class CardPo extends ComponentPo {
  constructor(selector = '[data-testid="resource-detail-status-card"]') {
    super(selector);
  }

  private scaler() {
    return new ScalerPo();
  }

  scaleUp(): Cypress.Chainable {
    return this.scaler().increaseButton();
  }

  scaleDown(): Cypress.Chainable {
    return this.scaler().decreaseButton();
  }

  podsRunningTotal(): Cypress.Chainable {
    return this.self().find('.rc-counter-badge .inactive');
  }

  replicaCount(): Cypress.Chainable {
    return this.scaler().getValue();
  }

  podsStatus(): Cypress.Chainable {
    return this.self().find('.status-row .label');
  }
}
