
class RequestUtils {
  private isVaiCacheEnabled?: boolean;

  constructUrlWithDefaultQueryParams(path = '', queryParams: string[] = [], { blockList }: { blockList: string[]} = { blockList: [] }): string {
    const qParams = [...queryParams];

    if (this.isVaiCacheEnabled && !blockList.includes('pagesize')) {
      qParams.push('pagesize=10000');
    }

    if (!blockList.includes('exclude')) {
      qParams.push('exclude=metadata.managedFields');
    }

    return `${ path }${ qParams.length ? `?${ qParams.join('&') }` : '' }`;
  }

  setIsVaiCacheEnabled(isVaiCacheEnabled: boolean) {
    this.isVaiCacheEnabled = isVaiCacheEnabled;
  }
}

const instance = new RequestUtils();

export default instance;
