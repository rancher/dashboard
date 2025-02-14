import ComponentPo, { GetOptions } from '@/cypress/e2e/po/components/component.po';
import ActionMenuPo from '@/cypress/e2e/po/components/action-menu-shell.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import ListRowPo from '@/cypress/e2e/po/components/list-row.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import PaginationPo from '@/cypress/e2e/po/components/pagination.po';
import HeaderRowPo from '@/cypress/e2e/po/components/header-row.po';

export default class SortableTablePo extends ComponentPo {
  /**
   * Create a name that should, when sorted by name, by default appear first
   */
  static firstByDefaultName(context = 'resource'): string {
    return `11111-first-in-list-unique-${ context }`;
  }
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
    return this.bulkActionDropDown().find(`.v-popper .v-popper__inner`);
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
   * Get group by buttons (flat list, group by namespace, or group by node)
   * @param index
   * @returns
   */
  groupByButtons(index: number) {
    return this.self().find(`[data-testid="button-group-child-${ index }"]`);
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

  filterComponent() {
    return this.self().find('[data-testid="search-box-filter-row"] input');
  }

  /**
   * Search box to query rows
   * @param searchText
   * @returns
   */
  filter(searchText: string) {
    return this.filterComponent()
      .focus()
      .clear()
      .type(searchText);
  }

  resetFilter() {
    return this.filterComponent()
      .focus()
      .clear();
  }

  //
  // sortable-table
  //

  groupElementWithName(name: string) {
    return this.self().contains('tr.group-row', name);
  }

  rowElements(options?: any) {
    return this.self().find('tbody tr:not(.sub-row):not(.group-row)', options);
  }

  rowElementWithName(name: string, options?: GetOptions) {
    return this.self().contains('tbody tr', new RegExp(`${ name }`), options);
  }

  rowElementWithPartialName(name: string) {
    return this.self().contains('tbody tr', name);
  }

  tableHeaderRowElementWithPartialName(name: string) {
    return this.self().contains('thead tr', name);
  }

  tableHeaderRow() {
    return new HeaderRowPo(this.self());
  }

  // sort
  sort(index: number) {
    return this.tableHeaderRow().column(index).find('.sort');
  }

  subRows() {
    return this.self().find('tbody tr.sub-row');
  }

  rowElementLink(rowIndex: number, columnIndex: number) {
    return this.getTableCell(rowIndex, columnIndex).find('a');
  }

  getTableCell(rowIndex: number, columnIndex: number) {
    return this.row(rowIndex).column(columnIndex);
  }

  row(index: number) {
    return new ListRowPo(this.rowElements().eq(index));
  }

  rowWithPartialName(name: string) {
    return new ListRowPo(this.rowElementWithPartialName(name));
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
    return this.self().find('tbody', { timeout: 10000 }).find('.no-rows');
  }

  /**
   * Get the row element count on sortable table
   */
  rowCount(): Cypress.Chainable<number> {
    return this.rowElements().then((el) => el.length);
  }

  /**
   * Check row element count on sortable table
   * @param isEmpty true if empty state expected (empty state message should display on row 1)
   * @param expected number of rows shown
   * @returns
   */
  checkRowCount(isEmpty: boolean, expected: number, options?, hasFilter = false) {
    return this.rowElements(options).should((el) => {
      if (isEmpty) {
        expect(el).to.have.length(expected);
        expect(el).to.have.text(hasFilter ? 'There are no rows which match your search query.' : 'There are no rows to show.');
        expect(el).to.have.attr('class', hasFilter ? 'no-results' : 'no-rows');
      } else {
        expect(el).to.have.length(expected);
        expect(el).to.have.attr('data-node-id');
      }
    });
  }

  /**
   * For a row with the given name open it's action menu and return the drop down
   */
  rowActionMenuOpen(name: string) {
    this.rowWithName(name).actionBtn()
      .click();

    return this.rowActionMenu();
  }

  /**
   * For a row with the given name return the checkbox used to select it
   */
  rowSelectCtlWithName(clusterName: string) {
    return new CheckboxInputPo(this.rowWithName(clusterName).column(0));
  }

  rowWithClusterName(clusterName: string) {
    return this.rowWithName(clusterName).column(2);
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

  deleteItemWithUI(name: string) {
    const row = this.rowActionMenuOpen(name).getMenuItem('Delete').click();

    new PromptRemove().remove();

    return row;
  }

  // Check that the sortable table loading indicator does not exist (data loading complete)
  checkLoadingIndicatorNotVisible() {
    cy.get('tbody', { timeout: 10000 }).find('.data-loading').should('not.exist');
  }

  checkNoRowsNotVisible() {
    cy.get('tbody', { timeout: 10000 }).find('.no-rows').should('not.exist');
  }

  // pagination
  pagination() {
    return new PaginationPo();
  }
}
