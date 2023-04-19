import ComponentPo from '~/cypress/e2e/po/components/component.po';

export default class DropBoxPo extends ComponentPo {
  open(index: number): Cypress.Chainable {
    return this.self().eq(index).click();
  }

  // check dropbox menu item is selected per dropbox index and item text label
  // index is the dropbox that you're targetting
  // label is the label/text of the dropbox item that you're targetting
  checkOptionSelected(index: number, label: string): Cypress.Chainable {
    return this.self().eq(index).find('.vs__selected-options').should(($el) => {
      expect($el).to.contain(label);
    });
  }
}
