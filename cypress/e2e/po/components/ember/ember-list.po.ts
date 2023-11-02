import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberListPo extends EmberComponentPo {
  actions(label: string) {
    return this.self().contains(label);
  }

  rowWithName(name: string) {
    return this.self().contains('.main-row', new RegExp(` ${ name } `));
  }

  rowActionMenuOpen(name: string) {
    this.rowWithName(name).find('.ember-basic-dropdown-trigger').click();
  }

  state(name: string) {
    return this.rowWithName(name).find('.state');
  }
}
