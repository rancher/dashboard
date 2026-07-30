import ComponentPo from '@/cypress/e2e/po/components/component.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

/**
 * PO for the LabeledSelectWithCreate component - a LabeledSelect that swaps
 * to a LabeledInput (with confirm/cancel buttons) when the user picks the
 * "Create new" option
 */
export default class LabeledSelectWithCreatePo extends ComponentPo {
  /**
   * The underlying select, shown when not creating a new value
   */
  select(): LabeledSelectPo {
    return new LabeledSelectPo(this.self());
  }

  /**
   * The new-value input, shown while creating a new value
   */
  createInput(): LabeledInputPo {
    return new LabeledInputPo(this.self().find('.create-input-row input'));
  }

  isCreating(): Cypress.Chainable<boolean> {
    return this.self().then(($el) => $el.find('.create-input-row').length > 0);
  }

  /**
   * Open the dropdown and click the "Create new" option, matched by its visible label
   */
  selectCreateNew(createLabel: string) {
    this.select().toggle();
    this.select().clickOptionWithLabel(createLabel);
  }

  confirmCreate() {
    return this.self().find('.confirm-create').click();
  }

  cancelCreate() {
    return this.self().find('.cancel-create').click();
  }
}
