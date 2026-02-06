import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

export default class ScalerPo extends ComponentPo {
  constructor(selector = '[data-testid="scaler"]') {
    super(selector);
  }

  getValue(): CypressChainable {
    return this.self().get('[data-testid="scaler-value"]');
  }

  decreaseButton(): CypressChainable {
    return this.self().get('[data-testid="scaler-decrease"]');
  }

  increaseButton(): CypressChainable {
    return this.self().get('[data-testid="scaler-increase"]');
  }
}
