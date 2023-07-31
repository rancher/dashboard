import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

export default class MgmtUserEditPo extends PagePo {
  private static createPath(clusterId: string, userId?: string ) {
    const root = `/c/${ clusterId }/auth/management.cattle.io.user`;

    return userId ? `${ root }/${ userId }?mode=edit` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', userId?: string) {
    super(MgmtUserEditPo.createPath(clusterId, userId));
  }

  name(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Name');
  }

  username(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Username');
  }

  description(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Description');
  }

  newPass(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'New Password');
  }

  confirmNewPass(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Confirm Password');
  }

  selectCheckbox(label:string): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), label);
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  saveAndWaitForRequests(method: string, url: any, multipleCalls?: boolean): CypressChainable {
    cy.intercept(method, url).as('request');
    this.saveCreateForm().click();

    return (multipleCalls ? cy.wait(['@request', '@request'], { timeout: 10000 }) : cy.wait('@request', { timeout: 10000 }));
  }
}
