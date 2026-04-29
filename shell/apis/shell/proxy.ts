import { addParam, addParams } from '@shell/utils/url';
import { Store } from 'vuex';
import { ProxyApi, ProxyRequestOptions } from '@shell/apis/intf/shell';
import { Metadata } from '@shell/types/resources/settings';
import { MANAGEMENT } from '@shell/config/types';

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
    const req = {
      url,
      method:               options.method,
      headers,
      redirectUnauthorized: false,
    } as any;

    if (options.data) {
      req.body = options.data;
    }
    const res = await this.store.dispatch('management/request', req, { root: true });

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
   */
  private buildHeaders(options: ProxyRequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: options.accept || 'application/json',
      ...(options.headers || {})
    };

    const credentialHeader = 'x-api-cattleauth-header';
    const tokenHeader = 'x-api-auth-header';

    if (options.credentialId) {
      headers[credentialHeader] = '';

      if (options.authSigner) {
        headers[credentialHeader] += `${ options.authSigner } `;
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
    } else if (options.token) {
      const scheme = options.authSigner ?? 'Bearer';

      headers[tokenHeader] = `${ scheme } ${ options.token }`;
    }

    return headers;
  }

  /**
   * Builds the proxy URL and auth headers for a request without dispatching it.
   *
   * Useful for integrating with lower-level HTTP handlers (e.g. the AWS SDK
   * request handler) that need to apply proxy routing and auth themselves
   * rather than going through the Vuex `management/request` action.
   *
   * @param options - Proxy request options.
   * @returns An object containing the resolved proxy `url` and the `headers`
   *          to merge into the outbound request.
   */
  public prepareRequest(options: ProxyRequestOptions): { url: string; headers: Record<string, string> } {
    return {
      url:     this.buildProxyUrl(options),
      headers: this.buildHeaders(options),
    };
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
   * Creates a `ProxyEndpoint` CR that registers the given domain patterns
   * with the Rancher `/meta/proxy` allow-list.
   *
   * The CR is cluster-scoped (`management.cattle.io/v3`, kind `ProxyEndpoint`).
   * Each entry in `urls` maps to a `spec.routes[].domain` entry on the CR.
   *
   * @param domains - Bare hostnames or wildcard patterns accepted by the proxy
   *                  backend (e.g. `api.example.com`, `%.amazonaws.com`).
   * @param name    - Optional metadata name for the CR. When omitted a name is
   *                  auto-generated by the API server.
   * @returns The created `ProxyEndpoint` resource.
   */
  public async allowDomains(domains: string[], name?: string): Promise<any> {
    const metadata = {} as Metadata;

    if (name) {
      metadata.name = name;
    } else {
      metadata.generateName = 'endpoints-';
    }
    const resource = await this.store.dispatch('management/create', {
      type: MANAGEMENT.PROXY_ENDPOINT,
      metadata,
      spec: { routes: domains.map((domain) => ({ domain })) },
    });

    return resource.save();
  }

  /**
   * Checks whether a domain pattern is already present in any existing
   * `ProxyEndpoint` CR.
   *
   * The comparison is a case-insensitive exact match against each
   * `spec.routes[].domain` entry across all CRs — the same format accepted
   * by `allowDomains` (e.g. `api.example.com`, `%.amazonaws.com`).
   *
   * @param domain - The hostname or wildcard pattern to look up.
   * @returns `true` if the pattern is found in at least one `ProxyEndpoint` CR,
   *          `false` otherwise.
   */
  public async isDomainAllowed(domain: string): Promise<boolean> {
    const endpoints: any[] = await this.store.dispatch('management/findAll', { type: MANAGEMENT.PROXY_ENDPOINT });

    const needle = domain.toLowerCase();

    return endpoints.some((endpoint) => (endpoint?.spec?.routes ?? []).some(
      (route: { domain: string }) => route.domain?.toLowerCase() === needle
    )
    );
  }

  /**
   * Checks whether a `ProxyEndpoint` CR with the given name exists.
   *
   * Uses `management/find` and treats a 404 response as `false` rather than
   * an error. Any other error is re-thrown.
   *
   * @param name - The metadata name of the `ProxyEndpoint` CR to look up.
   * @returns `true` if the CR exists, `false` if it is not found.
   */
  public async hasProxyEndpoint(name: string): Promise<boolean> {
    try {
      await this.store.dispatch('management/find', {
        type: MANAGEMENT.PROXY_ENDPOINT,
        id:   name,
        opt:  { force: false },
      });

      return true;
    } catch (e: any) {
      if (e?.status === 404) {
        return false;
      }
      throw e;
    }
  }

  /**
   * Safe dot-path getter utility.
   */
  private getByPath(obj: any, path: string): any {
    return path.split('.').reduce((acc: any, key: string) => acc?.[key], obj);
  }
}
