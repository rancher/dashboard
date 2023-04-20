import ComponentPo from '~/cypress/e2e/po/components/component.po';
import CheckboxInputPo from '~/cypress/e2e/po/components/checkbox-input.po';
import ButtonGroupPo from '~/cypress/e2e/po/components/button-group.po';
import RadioGroupInputPo from '~/cypress/e2e/po/components/radio-group-input.po';
import ListBoxPo from '~/cypress/e2e/po/components/dropdown-listbox.po';
import DropBoxPo from '~/cypress/e2e/po/components/dropbox-menu.po';

export default class PreferencesPagePo extends ComponentPo {
  constructor() {
    super('main > div.indented-panel');
  }

  title(): Cypress.Chainable {
    return this.self().get('h1').should('have.text', 'Preferences');
  }

  dropdownMenu(): DropBoxPo {
    return new DropBoxPo('.vs__dropdown-toggle');
  }

  listBox(): ListBoxPo {
    return new ListBoxPo('.vs__dropdown-menu');
  }

  button(): ButtonGroupPo {
    return new ButtonGroupPo('.btn-group');
  }

  checkbox(label: string): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), label);
  }

  radioButton(): RadioGroupInputPo {
    return new RadioGroupInputPo('.radio-group');
  }

  checkLangDomElement(label: string) {
    return cy.get(label).should('exist');
  }

  checkThemeDomElement(label: string) {
    return cy.get('html > body').should('have.class', label).and('exist');
  }
}
