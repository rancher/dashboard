import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';
import BannersPo from '@/cypress/e2e/po/components/banners.po';

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

  saveCreateWithErrorRetry(attempt = 1): Cypress.Chainable | null {
    if (attempt > 3) {
      return null;
    }

    cy.intercept('POST', 'v3/users').as('userCreation');
    cy.intercept('POST', 'v3/globalrolebindings').as('globalRoleBindingsCreation');

    this.saveCreateForm().click();

    // main xhr request for user creation
    cy.wait('@userCreation').then(({ response }) => {
      if (response?.statusCode !== 201) {
        cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting

        return this.saveCreateWithErrorRetry(++attempt);
      }

      // also covers globalrolebindings fail upon user creation
      // https://github.com/rancher/dashboard/issues/10260
      cy.wait('@globalRoleBindingsCreation').then(({ response }) => {
        if (response?.statusCode !== 201) {
          cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting

          return this.saveCreateWithErrorRetry(++attempt);
        }
      });
    });
  }

  saveAndWaitForRequests(method: string, url: any, multipleCalls?: boolean): CypressChainable {
    cy.intercept(method, url).as('request');
    this.saveCreateForm().click();

    return (multipleCalls ? cy.wait(['@request', '@request'], { timeout: 10000 }) : cy.wait('@request', { timeout: 10000 }));
  }
}
