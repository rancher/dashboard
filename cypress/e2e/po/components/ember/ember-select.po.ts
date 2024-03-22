import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberSelectPo extends EmberComponentPo {
  getMenuItem(label: string, index = 0) {
    return this.self().eq(index).contains(label);
  }

  selectMenuItemByLabel(label: string, index = 0) {
    return this.self().eq(index).contains(label).click();
  }

  /**
   * Select an <option> within a <select> using cy.select() command.
   * @param index
   * @param option
   * @returns
   */
  selectMenuItemByOption(option: string, index = 0) {
    return this.self().eq(index).select(option);
  }

  checkOptionSelected(label: string, index = 0) {
    return this.self().eq(index).should('contain.text', label);
  }
}
