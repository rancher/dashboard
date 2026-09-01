import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

export default class DialogPo extends ComponentPo {
  constructor(selector = '#modal-container-element') {
    super(selector);
  }

  getActionButton(): CypressChainable {
    return this.self().get('.dialog-buttons');
  }
}
