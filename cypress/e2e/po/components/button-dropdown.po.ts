import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';

export default class ButtonDropdownPo extends LabeledSelectPo {
  toggle() {
    return this.self().find('[data-testid="dropdown-button"]').click();
  }
}
