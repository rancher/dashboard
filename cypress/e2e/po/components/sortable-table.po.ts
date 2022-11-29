import ComponentPo from '@/cypress/e2e/po/components/component.po';
import ActionMenuPo from '@/cypress/e2e/po/components/action-menu.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import ListRowPo from '@/cypress/e2e/po/components/list-row.po';

export default class SortableTablePo extends ComponentPo {
  //
  // sortable-table-header
  //

  /**
   * Get the bulk action dropdown button (this is where collapsed bulk actions go when screen width is too small)
   */
  bulkActionDropDown() {
    return this.self().find(`.fixed-header-actions .bulk .bulk-actions-dropdown`);
  }

  /**
   * Open the bulk action drop down
   */
  bulkActionDropDownOpen() {
    return this.bulkActionDropDown().click();
  }

  /**
   * Get the popover containing the collapse bulk actions
   * @returns
   */
  bulkActionDropDownPopOver() {
    return this.bulkActionDropDown().find(`.v-popover .popover .popover-inner`);
  }

  /**
   * Get a visible bulk action button (opens popover)
   */
  bulkActionDropDownButton(name: string) {
    const popOver = this.bulkActionDropDownPopOver();

    popOver.should('be.visible');

    return popOver.find('li').contains(name);
  }

  //
  // sortable-table
  //

  rowElements() {
    return this.self().find('tbody tr');
  }

  rowElementWithName(name: string) {
    return this.self().contains('tbody tr', new RegExp(` ${ name } `));
  }

  row(index: number) {
    return new ListRowPo(this.rowElements().eq(index));
  }

  rowWithName(name: string) {
    return new ListRowPo(this.rowElementWithName(name));
  }

  rowActionMenu() {
    return new ActionMenuPo();
  }

  /**
   * For a row with the given name open it's action menu and return the drop down
   */
  rowActionMenuOpen(name: string, actionMenuColumn: number) {
    this.rowWithName(name).column(actionMenuColumn)
      .find('.btn')
      .click();

    return this.rowActionMenu();
  }

  /**
   * For a row with the given name return the checkbox used to select it
   */
  rowSelectCtlWithName(clusterName: string) {
    return new CheckboxInputPo(this.rowWithName(clusterName).column(0));
  }
}
