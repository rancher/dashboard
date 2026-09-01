import ComponentPo from '@/cypress/e2e/po/components/component.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

export default class CruResourcePo extends ComponentPo {
  findSubTypeByName(name: string) {
    return this.self().find(`[data-testid="subtype-banner-item-${ name }"]`);
  }

  selectSubType(groupIndex: number, itemIndex: number) {
    return this.self().find('.subtypes-container > div')
      .eq(groupIndex).find('.item')
      .eq(itemIndex);
  }

  selectSubTypeByIndex(index: number) {
    return this.self().find('.subtypes-container > div')
      .eq(index);
  }

  saveOrCreate(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  cancel(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-cancel"]', this.self());
  }

  saveAndWaitForRequests(method, endpoint: string, statusCode?: number): Cypress.Chainable {
    cy.intercept(method, endpoint).as(endpoint);
    this.saveOrCreate().click();
    /* eslint-disable cypress/no-assigning-return-values */
    const wait = cy.wait(`@${ endpoint }`, { timeout: 10000 });

    return statusCode ? wait.its('response.statusCode').should('eq', statusCode) : wait;
  }
}
