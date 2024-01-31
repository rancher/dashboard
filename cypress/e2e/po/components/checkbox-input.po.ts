import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

export default class CheckboxInputPo extends ComponentPo {
  static byLabel(self: CypressChainable, label: string): CheckboxInputPo {
    return new CheckboxInputPo(
      self
        .find('.checkbox-outer-container')
        .contains(label)
        .parent()
    );
  }

  /**
   * Click on the checkbox input button
   * @returns
   */
  set(): Cypress.Chainable {
    return this.self().find('.checkbox-custom').click();
  }

  /**
   * Return the checkbox input button from a given container
   * @returns
   */
  private input(): Cypress.Chainable {
    return this.self()
      .find('.checkbox-container');
  }

  isChecked(): Cypress.Chainable {
    return this.input().find('span.checkbox-custom').should('have.attr', 'aria-checked', 'true');
  }

  isUnchecked(): Cypress.Chainable {
    return this.input().find('span.checkbox-custom').should('not.have.attr', 'aria-checked', 'true');
  }

  isDisabled(): Cypress.Chainable {
    return this.input().then((el) => {
      expect(el).attr('class').to.include('disabled');
    });
  }
}
