import { addParam, addParams } from '@shell/utils/url';
import { Store } from 'vuex';
import { ProxyApi, ProxyRequestOptions } from '@shell/apis/intf/shell';

/**
 * Shell implementation of the `ProxyApi`.
 *
 * This API centralizes proxy request behavior used across providers:
 * - building `/meta/proxy` URLs
 * - applying credential or token auth headers
 * - dispatching requests via `management/request`
 * - optional de-pagination for list endpoints
 */
export class ProxyApiImpl implements ProxyApi {
  private store: Store<any>;

  /**
   * Creates a new Proxy API instance.
   *
   * @param store - Root Vuex store used to dispatch `management/request`.
   */
  constructor(store: Store<any>) {
    this.store = store;
  }

  /**
   * Returns the given path unchanged.
   *
   * @param path - URL/path string.
   * @returns The same path value.
   */
  public url(path: string): string {
    return path;
  }

  /**
   * Executes a generic proxy request.
   *
   * Behavior:
   * - Builds a proxied URL and dispatches `management/request`.
   * - When `dePaginate` is enabled, follows the configured `next` URL and
   *   merges results recursively.
   *
   * @param options - Proxy request options.
   * @returns The response payload or accumulated de-paginated output.
   */
  public async request(options: ProxyRequestOptions): Promise<any> {
    const url = this.buildProxyUrl(options);
    const headers = this.buildHeaders(options);

    const res = await this.store.dispatch('management/request', {
      url,
      headers,
      redirectUnauthorized: false,
    }, { root: true });

    if ( options.dePaginate && this.getByPath(res, options.nextUrlPath || 'links.pages.next') ) {
      const nextUrl = this.getByPath(res, options.nextUrlPath || 'links.pages.next');
      const out = this.mergeResponse(options, res);

      return this.request({
        ...options,
        url: nextUrl,
        out,
      });
    }

    return this.mergeResponse(options, res);
  }

  /**
   * Builds a `/meta/proxy` URL from explicit URL or endpoint + command inputs.
   */
  private buildProxyUrl(options: ProxyRequestOptions): string {
    let url = '/meta/proxy/';

    if ( options.url ) {
      return `${ url }${ options.url.replace(/^https?:\/\//, '') }`;
    }

    const endpoint = options.endpoint || '';
    const command = options.command || '';

    url += command ? `${ endpoint }/${ command }` : endpoint;

    if ( options.perPage ) {
      url = addParam(url, 'per_page', `${ options.perPage }`);
    }

    url = addParams(url, options.params || {});

    return url;
  }

  /**
   * Builds request headers, including auth headers derived from options.
   * //TODO nb should it be either/or token vs credential auth?
   */
  private buildHeaders(options: ProxyRequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: options.accept || 'application/json',
      ...(options.headers || {})
    };

    const credentialHeader = 'x-api-cattleauth-header'; // TODO nb explain the cattleauth header is used in conjunction with a 'signer' to parse secrets
    const tokenHeader = 'x-api-auth-header'; // TODO nb explain that x-api-auth-header is translated into the generic Authorization header

    if (options.token) {
      headers[tokenHeader] = `Bearer ${ options.token }`;
    }

    if (options.credentialId) {
      // TODO nb include authType even if no cred id? What about secret instead of cred?
      if (options.authSigner) {
        headers[credentialHeader] = `${ options.authSigner } `;
      }
      const { credentialId, passwordField, usernameField } = options;

      if (credentialId) {
        headers[credentialHeader] += `credID=${ credentialId } `;
      }
      if (usernameField) {
        headers[credentialHeader] += `usernameField=${ usernameField } `;
      }
      if (passwordField) {
        headers[credentialHeader] += `passwordField=${ passwordField } `;
      }
    }

    return headers;
  }

  /**
   * Merges de-paginated responses when an output accumulator is provided.
   */
  private mergeResponse(options: ProxyRequestOptions, res: any): any {
    if ( !options.out ) {
      return res;
    }

    const key = options.mergeKey || options.command || Object.keys(res || {}).find((x) => Array.isArray(res[x]));

    if ( key && Array.isArray(options.out[key]) && Array.isArray(res?.[key]) ) {
      options.out[key] = options.out[key].concat(res[key]);

      return options.out;
    }

    return res;
  }

  /**
   * Safe dot-path getter utility.
   */
  private getByPath(obj: any, path: string): any {
    return path.split('.').reduce((acc: any, key: string) => acc?.[key], obj);
  }
}
