import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';
import { LONG_TIMEOUT_OPT } from '~/cypress/support/utils/timeouts';

export default class ScalerPo extends ComponentPo {
  constructor(selector = '[data-testid="scaler"]') {
    super(selector);
  }

  getValue(): CypressChainable {
    return this.self().get('[data-testid="scaler-value"]', LONG_TIMEOUT_OPT);
  }

  decreaseButton(): CypressChainable {
    return this.self().get('[data-testid="scaler-decrease"]', LONG_TIMEOUT_OPT);
  }

  increaseButton(): CypressChainable {
    return this.self().get('[data-testid="scaler-increase"]', LONG_TIMEOUT_OPT);
  }
}
