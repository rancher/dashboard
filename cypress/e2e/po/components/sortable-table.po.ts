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
  detailsPageLinkWithName(name: string, selector = 'td.col-link-detail a') {
    return this.rowElementWithName(name).find(selector);
  }

  /**
   * Get the bulk action button
   * @param label
   * @returns
   */
  bulkActionButton(label: string) {
    return this.self().find(`.fixed-header-actions .bulk button`).contains(label);
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
    return cy.get('body').find('[dropdown-menu-collection]');
  }

  /**
   * Get a visible bulk action button (opens popover)
   */
  bulkActionDropDownButton(name: string) {
    const popOver = this.bulkActionDropDownPopOver();

    popOver.should('be.visible');

    return popOver.find('[dropdown-menu-item]').contains(name);
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
  filter(searchText: string, delay?: number) {
    return this.filterComponent()
      .focus()
      .clear()
      .type(searchText, { delay });
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
    return this.self().find('tbody tr:not(.sub-row):not(.group-row):not(.additional-sub-row)', options);
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
  rowNames(rowNameSelector = 'td:nth-of-type(3)', options?: any) {
    return this.rowElements(options).find(rowNameSelector).then(($els: any) => {
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
      .click().then((el) => {
        expect(el).to.have.attr('aria-expanded', 'true');
      });

    // Wait for the dropdown menu to appear and be populated with actual content
    cy.get('[dropdown-menu-collection]:visible').should('exist');

    // Wait for the dropdown to finish loading (not show "No actions available")
    cy.get('[dropdown-menu-collection]:visible').should('not.contain', 'No actions available');

    // Ensure at least one non-disabled menu item is present
    cy.get('[dropdown-menu-collection]:visible [dropdown-menu-item]:not([disabled])').should('exist');

    return this.rowActionMenu();
  }

  rowActionMenuClose(name: string) {
    this.rowWithName(name).actionBtn().then((el) => {
      expect(el).to.have.attr('aria-expanded', 'true');
    }).click()
      .then((el) => {
        expect(el).to.have.attr('aria-expanded', 'false');
      });

    return this.rowActionMenu();
  }

  /**
   * For a row with the given name return the checkbox used to select it
   */
  rowSelectCtlWithName(clusterName: string) {
    return new CheckboxInputPo(this.rowWithName(clusterName).column(0));
  }

  // FIXME: resource / context specific functionality shouldn't be in generic components
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

  waitForListItemRemoval(rowNameSelector = '.col-link-detail', name: string, options?: GetOptions) {
    return this.rowNames(rowNameSelector)
      .then((rowNames: string[]) => {
        rowNames.forEach((name, index) => cy.log(`Row ${ index }: ${ name }`));

        if (rowNames.includes(name)) {
          cy.log(`${ name } found. Waiting for it to be removed...`);
          cy.contains(rowNameSelector, name, options).should('not.exist');
        } else {
          cy.log(`${ name } already removed.`);
        }
      });
  }
}
