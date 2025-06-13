
class RequestUtils {
  private isVaiCacheEnabled?: boolean;

  initializeIsVaiCache(): Cypress.Chainable<any> {
    if (this.isVaiCacheEnabled !== undefined) {
      return cy.wrap(undefined);
    }

    return cy.isVaiCacheEnabled().then((isVaiCacheEnabled) => {
      this.isVaiCacheEnabled = isVaiCacheEnabled;
    });
  }
}

const instance = new RequestUtils();

export default instance;
