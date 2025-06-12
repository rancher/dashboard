
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

  /**
   * Supplement the provided path for a collection of steve resources with default steve query params
   */
  pathWithDefaultSteveParams(path = '', args?: { queryParams?: string[], blockList?: string[]}): string {
    const { queryParams = [], blockList = [] } = args || {};
    const qParams = [...queryParams];

    if (this.isVaiCacheEnabled && !blockList.includes('pagesize')) {
      qParams.push('pagesize=10000');
    }

    if (!blockList.includes('exclude')) {
      qParams.push('exclude=metadata.managedFields');
    }

    return `${ path }${ qParams.length ? `?${ qParams.join('&') }` : '' }`;
  }
}

const instance = new RequestUtils();

export default instance;
