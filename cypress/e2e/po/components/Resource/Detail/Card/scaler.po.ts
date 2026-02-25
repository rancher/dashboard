import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';
import { LONG_TIMEOUT_OPT } from '~/cypress/support/utils/timeouts';

export default class ScalerPo extends ComponentPo {
  constructor(selector = '.plus-minus') {
    super(selector);
  }

  getValue(): CypressChainable {
    return this.self().find('.value', LONG_TIMEOUT_OPT);
  }

  decreaseButton(): CypressChainable {
    return this.self().find('.icon-minus', LONG_TIMEOUT_OPT);
  }

  increaseButton(): CypressChainable {
    return this.self().find('.icon-plus', LONG_TIMEOUT_OPT);
  }
}
