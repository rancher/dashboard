import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class KeyValuePo extends ComponentPo {
  addButton(label: string) {
    return this.self().find('[data-testid="add_row_item_button"]').contains(label);
  }

  setKeyValueAtIndex(label: string, key: string, value: string, index: number, selector: string) {
    this.addButton(label).click();
    this.self().find(`${ selector } [data-testid="input-kv-item-key-${ index }"]`).type(key);
    this.self().find(`${ selector } [data-testid="kv-item-value-${ index }"]`).type(value);
  }
}
