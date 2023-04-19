import ComponentPo from '~/cypress/e2e/po/components/component.po';
import { CypressChainable } from '~/cypress/e2e/po/po.types';

export default class ButtonGroupPo extends ComponentPo {
  static byLabel(self: CypressChainable, label: string): ButtonGroupPo {
    return new ButtonGroupPo(
      self.find('.btn-group > .btn').contains(label)
    );
  }

  // Click on the button
  set(): Cypress.Chainable {
    return this.self().click();
  }

  // Check is button is highlighted
  isSelected(): Cypress.Chainable {
    return this.self().parent().should('have.class', 'bg-primary');
  }
}
