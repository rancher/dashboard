
class E2eRequestUtils {
  sqlCacheEnabled?: boolean;

  constructUrlWithDefaultQueryParams(path = '', queryParams: string[] = []): string {
    if (this.sqlCacheEnabled === undefined) {
      this.setSqlCacheEnabled();
    }

    const qParams = [...queryParams];

    if (this.sqlCacheEnabled) {
      qParams.push('pagesize=10000');
    }

    qParams.push('exclude=metadata.managedFields');

    return `${ path }${ qParams.length ? `?${ qParams.join('&') }` : '' }`;
  }

  setSqlCacheEnabled(hardcode?: boolean) {
    if (hardcode === undefined) {
      this.sqlCacheEnabled = true;
      // throw new Error('Not Implemented');
    } else {
      this.sqlCacheEnabled = hardcode;
    }
  }
}

const instance = new E2eRequestUtils();

export default instance;
