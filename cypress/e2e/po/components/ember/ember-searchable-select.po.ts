import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberSearchableSelectPo extends EmberComponentPo {
  setAndSelect(value: string) {
    // in some cases this won't actually select anything
    this.self().find('input').type(value);
    this.select(value);
  }

  clickAndSelect(value: string) {
    this.self().click();
    this.select(value);
  }

  select(value:string) {
    // Assumes select drop down is open
    cy.iFrame().find('.searchable-option').contains(value).click();
  }
}
