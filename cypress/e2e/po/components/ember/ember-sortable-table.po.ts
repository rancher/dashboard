import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';
import EmberSelectPo from '@/cypress/e2e/po/components/ember/ember-select.po';

export default class EmberSortableTablePo extends EmberComponentPo {
  /**
   * Get main row with name
   * @param name
   * @returns
   */
  rowWithName(name: string) {
    return this.self().contains('.main-row', new RegExp(` ${ name } `));
  }

  /**
   * Open row action menu for main row with name
   * @param name
   * @returns
   */
  rowActionMenuOpen(name: string) {
    return this.rowWithName(name).find('.ember-basic-dropdown-trigger').click();
  }

  /**
   * Get state of main row with name
   * @param name
   * @returns
   */
  state(name: string) {
    return this.rowWithName(name).find('.state');
  }

  /**
   * Get group row with name
   * @param name
   * @returns
   */
  groupRowWithName(name: string) {
    return this.self().contains('.group-row', new RegExp(` ${ name } `));
  }

  /**
   * Open row action menu for group row with name
   * @param name
   * @returns
   */
  groupRowActionMenuOpen(name: string) {
    return this.groupRowWithName(name).find('.ember-basic-dropdown-trigger').click();
  }

  /**
   * Get row for a given group with group and main row name
   * @param groupRowName
   * @param mainRowName
   * @returns
   */
  rowWithinGroupByName(groupRowName: string, mainRowName: string) {
    return this.self()
      .contains('.group-row', new RegExp(` ${ groupRowName } `))
      .siblings('tr.main-row')
      .contains(mainRowName);
  }

  bulkActions(label: string) {
    return cy.iFrame().contains('.bulk-actions', label);
  }

  actionMenu(): EmberSelectPo {
    return new EmberSelectPo('.ember-basic-dropdown-content');
  }
}
