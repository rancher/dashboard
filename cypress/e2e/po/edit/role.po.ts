import PagePo from '@/cypress/e2e/po/pages/page.po';

import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';

export default abstract class RoleEditPo extends PagePo {
  private static createPath(clusterId: string, resource: string, roleId?: string) {
    const root = `/c/${ clusterId }/auth/roles/${ resource }`;

    return roleId ? `${ root }/${ roleId }?mode=edit` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', resource: string, roleId?: string) {
    super(RoleEditPo.createPath(clusterId, resource, roleId));
  }

  name(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Name');
  }

  description(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Description');
  }

  selectCheckbox(label:string): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), label);
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  saveEditYamlForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }

  saveAndWaitForRequests(method: string, url: any): CypressChainable {
    cy.intercept(method, url).as('request');
    this.saveCreateForm().click();

    return cy.wait('@request', { timeout: 10000 });
  }

  selectVerbs(itemRow: number, optionIndex: number) {
    const selectVerb = new LabeledSelectPo(`[data-testid="grant-resources-verbs${ itemRow }"]`, this.self());

    selectVerb.toggle();
    selectVerb.clickOption(optionIndex);
  }

  selectResourcesByLabelValue(itemRow: number, label: string) {
    const selectResources = new LabeledSelectPo(`[data-testid="grant-resources-resources${ itemRow }"]`, this.self());

    selectResources.toggle();
    selectResources.clickOptionWithLabel(label);
  }

  selectCreatorDefaultRadioBtn(optionIndex: number): CypressChainable {
    const selectRadio = new RadioGroupInputPo('[data-testid="roletemplate-creator-default-options"] div > .radio-container', this.self());

    return selectRadio.set(optionIndex);
  }

  selectLockedRadioBtn(optionIndex: number): CypressChainable {
    const selectRadio = new RadioGroupInputPo('[data-testid="roletemplate-locked-options"] div > .radio-container', this.self());

    return selectRadio.set(optionIndex);
  }
}
