import ComponentPo from '@/cypress/e2e/po/components/component.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

export default class FooterPo extends ComponentPo {
  create() {
    return new AsyncButtonPo(this.self().find('.buttons .right .role-primary'));
  }
}
