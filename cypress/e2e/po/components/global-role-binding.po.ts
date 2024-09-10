import ComponentPo from '@/cypress/e2e/po/components/component.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';

export default class GlobalRoleBindings extends ComponentPo {
  constructor(selector = '.global-permissions') {
    super(selector);
  }

  roleCheckbox(roleId: string) {
    return new CheckboxInputPo(`[data-testid="grb-checkbox-${ roleId }"]`);
  }

  globalOptions() {
    return this.self().find('.checkbox-section--global .checkbox-label-slot .checkbox-label').then((els) => {
      return Cypress.$.makeArray(els).map((el) => el.innerText);
    });
  }
}
