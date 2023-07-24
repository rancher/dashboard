import ComponentPo from '@/cypress/e2e/po/components/component.po';
import ActionMenuPo from '@/cypress/e2e/po/components/action-menu.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import ListRowPo from '@/cypress/e2e/po/components/list-row.po';

export default class SortableTablePo extends ComponentPo {
  //
  // sortable-table-header
  //

  /**
   * Returns the link for resource details for a table row with a given name
   */
  detailsPageLinkWithName(name: string) {
    return this.rowElementWithName(name).find('td.col-link-detail a');
  }

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

  /**
   * Delete button (displays on page after row element selected)
   */
  deleteButton() {
    return cy.getId('sortable-table-promptRemove');
  }

  selectedCountText() {
    return cy.get('.action-availability');
  }

  /**
   * Search box to query rows
   * @param searchText
   * @returns
   */
  filter(searchText: string) {
    return cy.get('[data-testid="search-box-filter-row"] input')
      .focus()
      .clear()
      .type(searchText);
  }

  //
  // sortable-table
  //

  rowElements() {
    return this.self().find('tbody tr:not(.sub-row)');
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

  /**
   * Get rows names. To avoid the 'no rows' on first load use `noRowsShouldNotExist`
   */
  rowNames(rowNameSelector = 'td:nth-of-type(3)') {
    return this.rowElements().find(rowNameSelector).then(($els: any) => {
      return (
        Cypress.$.makeArray<string>($els).map((el: any) => el.innerText as string)
      );
    });
  }

  rowActionMenu() {
    return new ActionMenuPo();
  }

  noRowsShouldNotExist() {
    return this.noRowsText().should('not.exist');
  }

  noRowsText() {
    return this.self().find('tbody').find('.no-rows');
  }

  /**
   * Check row element count on sortable table
   * @param isEmpty true if empty state expected (empty state message should display on row 1)
   * @param expected number of rows shown
   * @returns
   */
  checkRowCount(isEmpty: boolean, expected: number) {
    return this.rowElements().should((el) => {
      if (isEmpty) {
        expect(el).to.have.length(expected);
        expect(el).to.have.text('There are no rows to show.');
        expect(el).to.have.attr('class', 'no-rows');
      } else {
        expect(el).to.have.length(expected);
        expect(el).to.have.attr('data-node-id');
      }
    });
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

  /**
   * Select all list items
   */
  selectAllCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="sortable-table_check_select_all"]');
  }

  selectedCount() {
    return cy.get('.row-check input[type="checkbox"]:checked').its('length');
  }
}
