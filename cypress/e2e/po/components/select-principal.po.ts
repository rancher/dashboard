import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';

export default class SelectPrincipalPo extends LabeledSelectPo {
  toggle() {
    return super.toggle();
  }

  filterByName(name: string) {
    return super.filterByName(name);
  }

  clickOptionWithLabel(name: string) {
    return super.clickOptionWithLabel(name);
  }
}
