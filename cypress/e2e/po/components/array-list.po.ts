import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ArrayListPo extends ComponentPo {
  /**
   * Return a given array list item by index
   * @param index The index of the array list item
   * @param parentIndex Optional parent index for nested array lists
   * @returns
   */
  arrayListItem(index: number, parentIndex?: number): Cypress.Chainable {
    if (parentIndex !== undefined) {
      // Handle nested array list items
      return this.self()
        .find(`[data-testid="array-list-box${ parentIndex }"]`)
        .find(`[data-testid="array-list-box${ index }"]`);
    }

    // Handle top-level array list items
    return this.self().find(`[data-testid="array-list-box${ index }"]`);
  }

  /**
   * Closes a given array list item by index
   * @param index The index of the item to close
   * @param buttonIndex The index of the close button
   * @param parentIndex Optional parent index for nested array lists
   * @returns
   */
  closeArrayListItem(index: number, parentIndex?: number, buttonIndex?: number): Cypress.Chainable {
    return this.arrayListItem(index, parentIndex).find(`[data-testid="remove-item-${ buttonIndex || 0 }"]`).click();
  }

  /**
   * Clicks the add button with the specified label
   * @param label The label text of the add button
   * @param parentIndex Optional parent index for nested add buttons
   * @returns
   */
  clickAdd(label: string, parentIndex?: number): Cypress.Chainable {
    if (parentIndex !== undefined) {
      return this.arrayListItem(parentIndex)
        .find(`[data-testid="array-list-button"]`)
        .contains(label)
        .click();
    }

    return this.self().find(`[data-testid="array-list-button"]`).contains(label).click();
  }

  clearListItem(index: number) {
    return this.self().find(`[data-testid="array-list-box${ index }"]`).find('input').clear();
  }

  /**
   * Sets a value at the specified index
   * @param value The value to set
   * @param index The index where to set the value
   * @param label The label of the add button
   * @param parentIndex Optional parent index for nested array lists
   * @returns
   */
  setValueAtIndex(value: string, index: number, label: string, parentIndex?: number, clickAdd = true): Cypress.Chainable {
    if (clickAdd) {
      this.clickAdd(label, parentIndex);
    }

    return this.arrayListItem(index, parentIndex).find('input').type(value);
  }
}
