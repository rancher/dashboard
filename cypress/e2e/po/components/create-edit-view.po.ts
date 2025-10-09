import ComponentPo, { GetOptions } from '@/cypress/e2e/po/components/component.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';

export default class CreateEditViewPo extends ComponentPo {
  errorBanner() {
    return this.self().find('#cru-errors');
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  createButton() {
    return new AsyncButtonPo(this.self().find('.cru-resource-footer .role-primary'));
  }

  create() {
    return this.createButton().click();
  }

  save() {
    return new AsyncButtonPo(this.self().find('.cru-resource-footer .role-primary')).click();
  }

  cancel() {
    return new AsyncButtonPo(this.self().find('.cru-resource-footer .role-secondary')).click();
  }

  saveAndWait() {
    return new AsyncButtonPo(this.self().find('.cru-resource-footer .role-primary')).action('Save', 'Saved');
  }

  nextPage() {
    return new AsyncButtonPo(this.self().find('.cru-resource-footer .role-primary')).click();
  }

  saveButtonPo() :AsyncButtonPo {
    return new AsyncButtonPo(this.self().find('.cru-resource-footer .role-primary'));
  }

  editAsYaml() {
    return new AsyncButtonPo(this.self().find('[data-testid="form-yaml"]')).click();
  }

  editClusterAsYaml() {
    return new AsyncButtonPo(this.self().find('[data-testid="rke2-custom-create-yaml"]')).click();
  }

  saveClusterAsYaml() {
    return new AsyncButtonPo(this.self().find('[data-testid="rke2-custom-create-yaml-save"]')).click();
  }

  saveAndWaitForRequests(method, endpoint: string, statusCode?: number, options?: GetOptions): Cypress.Chainable {
    cy.intercept(method, endpoint).as(endpoint);
    this.save();
    /* eslint-disable cypress/no-assigning-return-values */
    const wait = cy.wait(`@${ endpoint }`, options);

    return statusCode ? wait.its('response.statusCode').should('eq', statusCode) : wait;
  }
}
