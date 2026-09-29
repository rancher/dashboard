import ComponentPo, { GetOptions } from '@/cypress/e2e/po/components/component.po';
import ActionMenuPo from '@/cypress/e2e/po/components/action-menu-shell.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import ListRowPo from '@/cypress/e2e/po/components/list-row.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import PaginationPo from '@/cypress/e2e/po/components/pagination.po';
import HeaderRowPo from '@/cypress/e2e/po/components/header-row.po';

/**
 * Matches only a list's real resource rows.
 *
 * A bare `tbody tr` also matches the `tr.group-row` headers rendered when the list is grouped (for
 * example the `Namespace: <name>` headers of a namespace-grouped list) and the sub-rows some
 * resources expand into. Those rows carry no per-row action button and no select checkbox, so a
 * lookup that lands on one can never resolve them.
 */
export const RESOURCE_ROW_SELECTOR = 'tbody tr:not(.sub-row):not(.group-row):not(.additional-sub-row)';

/**
 * Is the table on screen laid out for table views: a query box instead of the search box, and the
 * bulk actions in one menu for the selection. Tables without a schema keep the old layout even with
 * the feature on.
 *
 * Read from the page rather than `self()`: a table built from a chainable shares it, and each `find`
 * moves its subject, so after one lookup `self()` is no longer the table
 */
const withTableViews = <S>(tableViews: () => Cypress.Chainable<S>, old: () => Cypress.Chainable<S>): Cypress.Chainable<S> => cy.get('body').then(($body) => ($body.find('.has-table-views:visible').length ? tableViews() : old()));

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
   * Get the bulk action button. With table views the bulk actions are in the selection's menu, which
   * this opens
   */
  bulkActionButton(label: string) {
    return withTableViews(() => {
      this.openSelectionActions();

      return this.bulkActionDropDownPopOver().contains('[dropdown-menu-item]', label);
    }, () => this.self().find(`.fixed-header-actions .bulk button`).contains(label));
  }

  /**
   * A bulk action by its action name (eg `activate`). With table views, opens the selection's menu
   */
  bulkAction(action: string) {
    return withTableViews(() => {
      this.openSelectionActions();

      return cy.get(`[data-testid$="-selection-action-${ action === 'promptRemove' ? 'delete' : action }"]`);
    }, () => cy.get(`[data-testid="sortable-table-${ action }"]`));
  }

  /**
   * Get the bulk action dropdown button (this is where collapsed bulk actions go when screen width is
   * too small). With table views, the selection's menu
   */
  bulkActionDropDown() {
    return withTableViews(() => this.selectionActionsButton(), () => this.self().find(`.fixed-header-actions .bulk .bulk-actions-dropdown`));
  }

  /**
   * Open the bulk action drop down
   */
  bulkActionDropDownOpen() {
    return withTableViews(() => this.openSelectionActions(), () => this.bulkActionDropDown().click());
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
   * The "N Selected" menu that holds the bulk actions with table views. Only there while rows are
   * selected
   */
  selectionActionsButton() {
    return cy.get('[data-testid$="-selection-actions"]:visible');
  }

  openSelectionActions() {
    return this.selectionActionsButton().then(($button) => {
      if ($button.attr('aria-expanded') === 'true') {
        return;
      }

      // A menu closing from the last pick stays on the page while it fades, and takes a click on its
      // button as one outside it, closing the menu that click opens
      cy.get('[data-testid*="-selection-action-"]').should('not.exist');
      cy.wrap($button).click();
    });
  }

  /**
   * Get group by buttons (flat list, group by namespace, or group by node). Tables with table views
   * group from their View menu instead, see `groupBy`
   * @param index
   * @returns
   */
  groupByButtons(index: number) {
    return this.self().find(`[data-testid="button-group-child-${ index }"]`);
  }

  viewMenuButton() {
    return cy.get('[data-testid="table-views-view-menu"]:visible');
  }

  /**
   * Open the View menu's Group By list
   */
  openGroupBy() {
    // As with the selection's menu: one still fading would close the menu this click opens
    cy.getId('table-views-view-group').should('not.exist');
    this.viewMenuButton().click();

    return cy.getId('table-views-view-group').click();
  }

  /**
   * An entry of the open Group By list, by its label
   */
  groupByOption(label: string) {
    return cy.contains('[data-testid^="table-views-group-"]', new RegExp(`^\\s*${ label }\\s*$`));
  }

  /**
   * Close the View menu, and the list it opened
   */
  closeViewMenu() {
    return this.viewMenuButton().click();
  }

  /**
   * Group the table by one of its View menu's Group By entries, by label (`None` for a flat list)
   */
  groupBy(label: string) {
    this.openGroupBy();
    this.groupByOption(label).then(($option) => {
      // A click on the current grouping would turn it off. Forced: the list is drawn beside the View
      // menu but sits inside it on the page, so Cypress thinks the menu's overflow hides it
      if (!$option.hasClass('selected')) {
        cy.wrap($option).click({ force: true });
      }
    });

    return this.closeViewMenu();
  }

  /**
   * Delete button (displays on page after row element selected)
   */
  deleteButton() {
    return this.bulkAction('promptRemove');
  }

  /**
   * How many rows are selected, eg "2 selected" (reads "2 Selected" with table views)
   */
  selectedCountText() {
    return withTableViews(() => this.selectionActionsButton(), () => cy.get('.action-availability'));
  }

  /**
   * The search box, or with table views the query box
   */
  filterComponent() {
    return this.self().find('[data-testid="table-views-query"], [data-testid="search-box-filter-row"] input').first();
  }

  /**
   * Search box to query rows
   * @param searchText
   * @returns
   */
  filter(searchText: string, delay?: number) {
    return this.resetFilter()
      .type(searchText, { delay })
      .then(($el) => {
        if (!$el.is('[contenteditable]')) {
          return;
        }

        // The query box's suggestions would cover the rows
        cy.wrap($el).blur();
        // Until the query settles and its rows arrive, the rows on screen are the old query's
        cy.get('.has-table-views[aria-busy="true"]').should('not.exist');
      });
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

  /**
   * Get all group row elements that contain the given name
   * Unlike groupElementWithName which only returns the first match,
   * this returns all matching group rows
   * @param name - The text to search for in group rows
   * @returns Cypress chainable with all matching group row elements
   */
  groupElementsWithName(name: string) {
    return this.self().find('tr.group-row').filter((index, el) => {
      return Cypress.$(el).text().includes(name);
    });
  }

  rowElements(options?: any) {
    return this.self().find(RESOURCE_ROW_SELECTOR, options);
  }

  /**
   * @param resourceRowsOnly restrict the lookup to real resource rows, skipping group headers and
   * sub-rows. Needed when the name also appears in a group header - a namespaced resource that
   * shares its namespace's name matches the `Namespace: <name>` header first, and that row has no
   * action button or checkbox to act on. Defaults to the historic `tbody tr` match.
   */
  rowElementWithName(name: string, options?: GetOptions, resourceRowsOnly = false) {
    // Assert the container exists before .contains() runs. Under Cypress 12's
    // grouped-query retries, a transiently empty container (e.g. during SPA
    // navigation) would otherwise flow an empty jQuery{0} subject into
    // .contains(), which rejects it ("requires a DOM element").
    return this.self().should('exist').contains(resourceRowsOnly ? RESOURCE_ROW_SELECTOR : 'tbody tr', new RegExp(`${ name }`), options);
  }

  rowElementWithPartialName(name: string, options?: GetOptions) {
    return this.self().contains('tbody tr', name, options);
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

  rowWithPartialName(name: string, options?: GetOptions) {
    return new ListRowPo(this.rowElementWithPartialName(name, options));
  }

  /**
   * @param resourceRowsOnly see `rowElementWithName`
   * @param options optional Cypress options (e.g. a longer timeout) for the row lookup
   */
  rowWithName(name: string, resourceRowsOnly = false, options?: GetOptions) {
    return new ListRowPo(this.rowElementWithName(name, options, resourceRowsOnly));
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
    // Get the visible dropdown menu - this ensures we only interact with a menu that's actually open
    return new ActionMenuPo('[dropdown-menu-collection]:visible');
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
   * get the count of rows in a group
   */
  groupRowCount(groupName: string) {
    return this.groupElementWithName(groupName).nextUntil('tr.group-row').then((el) => el.length);
  }

  /**
   * Check row element count on sortable table
   * @param isEmpty true if empty state expected (empty state message should display on row 1)
   * @param expected number of rows shown (empty state still provides 1 row)
   * @returns
   */
  checkRowCount(isEmpty: boolean, expected: number, options?: any, hasFilter = false) {
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
  rowActionMenuOpen(name: string, skipNoActionAvailableCheck?: boolean, resourceRowsOnly = false) {
    this.rowWithName(name, resourceRowsOnly).actionBtn()
      .click().then((el) => {
        expect(el).to.have.attr('aria-expanded', 'true');
      });

    const actionMenu = this.rowActionMenu();

    // Wait for the dropdown menu to appear and be populated with actual content
    actionMenu.self().should('exist');

    // Wait for the dropdown to finish loading (not show "No actions available")
    if (!skipNoActionAvailableCheck) {
      actionMenu.checkNoActionsAvailable(false);
      // Ensure at least one non-disabled menu item is present
      actionMenu.atLeastOneActiveMenuItem();
    }

    return actionMenu;
  }

  rowActionMenuClose(name: string) {
    this.rowWithName(name).actionBtn().click();

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
