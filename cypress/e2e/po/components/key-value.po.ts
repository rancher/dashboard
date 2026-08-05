import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

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
}
