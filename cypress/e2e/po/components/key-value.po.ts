import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

const KEY_INPUTS = '[data-testid^="input-kv-item-key-"]';
// KeyValue.vue emits its updates behind a 500ms debounce, plus a small margin
const UPDATE_DEBOUNCE = 750;

export default class KeyValuePo extends ComponentPo {
  private multiline: boolean;

  constructor(self: any, parent?: CypressChainable, multiline = false) {
    if (typeof self === 'string' && parent) {
      super(self, parent);
    } else {
      super(self);
    }
    this.multiline = multiline;
  }

  addButton(label: string) {
    return this.self().find('[data-testid="add_row_item_button"]').contains(label);
  }

  setKeyValueAtIndex(label: string, key: string, value: string, index: number, selector: string) {
    this.addButton(label).click();
    this.self().find(`${ selector } [data-testid="input-kv-item-key-${ index }"]`).type(key);
    this.self().find(`${ selector } [data-testid="kv-item-value-${ index }"]`).type(value);
  }

  addRow() {
    return this.self().find('[data-testid="add_row_item_button"]').click();
  }

  keyInput(index: number) {
    return this.self().find(`[data-testid="input-kv-item-key-${ index }"]`);
  }

  valueInput(index: number) {
    if (this.multiline) {
      return this.self().find(`[data-testid="kv-item-value-${ index }"] [data-testid="value-multiline"]`);
    }

    return this.self().find(`[data-testid="input-kv-item-value-${ index }"]`);
  }

  setKeyAtIndex(key: string, index: number) {
    return this.keyInput(index).clear().type(key);
  }

  setValueAtIndex(value: string, index: number) {
    return this.valueInput(index).clear().type(value);
  }

  keyAtIndex(index: number) {
    return this.keyInput(index).invoke('val');
  }

  valueAtIndex(index: number) {
    return this.valueInput(index).invoke('val');
  }

  keyWarningIcon(index: number) {
    return this.keyInput(index).parents('.kv-item.key').find('.icon-warning');
  }

  valueWarningIcon(index: number) {
    return this.valueInput(index).parents('.kv-item.value').find('.icon-warning');
  }

  removeButton(index: number) {
    return this.self().find(`[data-testid="remove-column-${ index }"]`);
  }

  /**
   * Add a row at the end of the list and fill it in
   */
  addKeyValue(key: string, value: string) {
    return this.self().then(($el) => {
      const index = $el.find(KEY_INPUTS).length;

      this.addRow();
      this.setKeyAtIndex(key, index);
      this.setValueAtIndex(value, index);
    });
  }

  /**
   * Remove the row with the given key, without having to know its position
   */
  removeKey(key: string) {
    return this.self().find(KEY_INPUTS).then(($inputs) => {
      const index = Cypress.$.makeArray($inputs).findIndex((input) => (input as HTMLInputElement).value === key);

      expect(index, `row with key ${ key }`).to.be.gte(0);

      this.removeButton(index).find('button').click();
    });
  }

  /**
   * Wait for the last edit to reach the model, e.g. before saving the form
   */
  waitForUpdate() {
    return cy.wait(UPDATE_DEBOUNCE); // eslint-disable-line cypress/no-unnecessary-waiting
  }
}
