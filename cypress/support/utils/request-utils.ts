
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
  pathWithDefaultSteveParams(path = '', args?: {
    /**
     * Is this fetching a collection?
     */
    isList?: boolean,
    /**
     * Does this request have a type that support server-side pagination?
     */
    sspEnabled?: boolean,
    /**
     * Prefix these additional query params
     */
    queryParams?: string[],
    /**
     * Explicitly don't add these query params
     */
    blockList?: string[]
  }): string {
    const {
      queryParams = [], blockList = [], sspEnabled = false, isList = false
    } = args || {};
    const qParams = [...queryParams];

    if (this.isVaiCacheEnabled && isList && sspEnabled && !blockList.includes('pagesize')) {
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
