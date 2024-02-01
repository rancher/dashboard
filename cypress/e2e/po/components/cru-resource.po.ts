import ComponentPo from '@/cypress/e2e/po/components/component.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

export default class CruResourcePo extends ComponentPo {
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

  saveAndWaitForRequests(method, endpoint: string, statusCode?: number): Cypress.Chainable {
    cy.intercept(method, endpoint).as(endpoint);
    this.saveOrCreate().click();

    return statusCode ? cy.wait(`@${ endpoint }`, { timeout: 10000 }).its('response.statusCode').should('eq', statusCode) : cy.wait(`@${ endpoint }`, { timeout: 10000 });
  }
}
