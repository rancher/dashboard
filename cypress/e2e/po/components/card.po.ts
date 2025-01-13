import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

export default class CardPo extends ComponentPo {
  constructor(selector = '[data-testid="card"]') {
    super(selector);
  }

  getTitle(): CypressChainable {
    return this.self().get('[data-testid="card-title-slot"]');
  }

  getBody(): CypressChainable {
    return this.self().get('[data-testid="card-body-slot"]');
  }

  getError(): CypressChainable {
    return this.self().get('[data-testid="card-body-slot"] > .text-error');
  }

  getActionButton(): CypressChainable {
    return this.self().get('[data-testid="card-actions-slot"]');
  }
}
