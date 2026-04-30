
/**
 * Cloud Credential authentication for `/meta/proxy` requests.
 *
 * Instructs the Rancher backend to fetch the named Cloud Credential secret,
 * extract the relevant fields, and sign the upstream `Authorization` header.
 * The browser never sees the credential value.
 *
 * The backend constructs `X-Api-CattleAuth-Header` in the form:
 * `<signer> credID=<id> [usernameField=<field>] [passwordField=<field>]`
 *
 * Secret data keys are normalised before lookup: a key stored as
 * `<configPrefix>-<key>` (e.g. `amazonec2Config-secretKey`) is matched by
 * passing just `<key>` (e.g. `secretKey`).
 */
export interface ProxyAuthCloudCredential {
  /**
   * Rancher Cloud Credential ID, or any opaque secret in the
   * `cattle-global-data` namespace (format: `cattle-global-data:<name>`).
   */
  id: string;

  /**
   * Signing strategy used to build the upstream `Authorization` header.
   *
   * - `bearer`    – `Authorization: Bearer <secret[passwordField]>`
   * - `basic`     – `Authorization: Basic base64(<secret[usernameField]>:<secret[passwordField]>)`
   * - `digest`    – HTTP Digest auth using `usernameField` and `passwordField`
   * - `awsv4`     – AWS Signature V4 (reads `accessKey` and `secretKey` from secret)
   * - `arbitrary` – Sets arbitrary headers supplied via `headers` (no credential lookup)
   *
   * Read the details of signer implementation here: https://github.com/rancher/rancher/tree/main/pkg/httpproxy
   *
   * If no authSigner is specified Rancher will forward the cloud credential id in the Authorization header without signing.
   */
  authSigner?: 'bearer' | 'awsv4' | 'basic' | 'digest' | 'arbitrary';

  /**
   * Key inside the credential secret to use as the password / bearer token.
   * Required by: `bearer`, `basic`, `digest`.
   */
  passwordField?: string;

  /**
   * Key inside the credential secret to use as the username / access-key.
   * Required by: `basic`, `digest`.
   */
  usernameField?: string;
}

/**
 * Plain-token authentication for `/meta/proxy` requests.
 *
 * The token is forwarded as the upstream `Authorization` header via
 * `X-API-Auth-Header: <scheme> <token>`.
 */
export interface ProxyAuthToken {
  /** Raw token value sent to the upstream API. */
  token: string;

  /**
   * Authorization scheme prefix. Defaults to `Bearer` when omitted.
   * Use `Basic` for base64-encoded credentials, etc.
   */
  authSigner?: 'bearer' | 'awsv4' | 'basic' | 'digest' | 'arbitrary';
}

export interface ProxyRequestOptions {
  /**
   * Full upstream URL passed as a `URL` object.
   *
   * Examples:
   * - `new URL('https://api.example.com/v1/regions')` →
   *   `/meta/proxy/api.example.com/v1/regions`
   * - `new URL('http://api.example.com:1234/path')` →
   *   `/meta/proxy/http:/api.example.com:1234/path`
   *
   * TLS on port 443 is assumed. For a non-standard port include it in the
   * `URL` host. For plain HTTP the double-slash is collapsed to one so the
   * backend receives `/meta/proxy/http:/example.com:1234/path`.
   *
   * Use `URL.searchParams` to construct query strings rather than building
   * them manually.
   */
  url: URL;

  /**
   * HTTP method. Defaults to `GET` when omitted.
   */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  /**
   * Additional headers merged into the outgoing request.
   * Auth headers (`X-API-Auth-Header`, `X-Api-CattleAuth-Header`) are
   * managed automatically via `authentication` — do not set them here.
   */
  headers?: Record<string, string>;

  /**
   * Value for the `Accept` header. Defaults to `application/json`.
   */
  accept?: string;

  /**
   * Request body for `POST`, `PUT`, and `PATCH` requests.
   */
  data?: any;

  /**
   * Authentication strategy. Supply either a `ProxyAuthCloudCredential`
   * (to have Rancher sign the request from a stored secret) or a
   * `ProxyAuthToken` (to send a raw bearer/basic token directly).
   *
   * Discriminated by field presence: `'id' in authentication` → cloud
   * credential; `'token' in authentication` → plain token.
   */
  authentication?: ProxyAuthCloudCredential | ProxyAuthToken;

  /**
   * Optional post-processing callback invoked with the raw response before
   * `request()` returns. Use `createDepaginator()` from
   * `@shell/apis/shell/proxy` to handle paginated list endpoints.
   *
   * @example
   * ```ts
   * import { createDepaginator } from '@shell/apis/shell/proxy';
   *
   * const baseOptions = { url: 'api.example.com/v1/items', authentication };
   * const result = await proxy.request({
   *   ...baseOptions,
   *   postProcess: createDepaginator(proxy, baseOptions, { mergeKey: 'items' }),
   * });
   * ```
   */
  postProcess?: (res: any) => Promise<any>;
}

/**
 * Proxy API for Rancher's server-side `/meta/proxy` endpoint.
 *
 * `/meta/proxy` lets the UI call third-party APIs (for example cloud
 * provider APIs) through the Rancher server, avoiding browser CORS limits.
 *
 * Base format:
 * - `/meta/proxy/<host>/<path>`
 * - TLS + port `443` are assumed by default.
 * - To use a different port: `/meta/proxy/example.com:1234/<path>`.
 * - For plain HTTP (if absolutely required):
 *   `/meta/proxy/http:/example.com:1234/<path>` (note one slash after `http:`).
 *
 * Notes from docs:
 * - `X-API-Auth-Header` is forwarded as `Authorization` to the upstream.
 * - `X-Api-CattleAuth-Header` can instruct Rancher to sign/authenticate
 *   upstream requests with data from a Rancher Cloud Credential
 */
export interface ProxyApi {
  /**
   * Sends a request through Rancher's `/meta/proxy` endpoint.
   *
   * Builds the proxy URL and auth headers from `options`, dispatches via
   * `management/request`, and returns the response. If `options.postProcess`
   * is set it is called with the response before returning, allowing callers
   * to implement pagination or other response transforms.
   */
  request(options: ProxyRequestOptions): Promise<any>;

  /**
   * Creates a `ProxyEndpoint` CR (`management.cattle.io/v3`) that adds the
   * given domains to the Rancher `/meta/proxy` allow-list.
   *
   * Each entry in `domains` should be a bare hostname or a wildcard pattern
   * accepted by the backend (e.g. `api.example.com`, `%.amazonaws.com`).
   * Overly-broad wildcards (e.g. `*.com`) are rejected by the backend.
   *
   * @param domains - One or more domain patterns to allow.
   * @param name    - Optional name for the `ProxyEndpoint` CR.
   *                  Defaults to a generated name when omitted.
   * @returns The created `ProxyEndpoint` resource.
   */
  allowDomains(domains: string[], name?: string): Promise<any>;

  /**
   * Checks whether a domain pattern is already present in any existing
   * `ProxyEndpoint` CR.
   *
   * The comparison is a case-insensitive exact match against each
   * `spec.routes[].domain` value — the same format accepted by `allowDomains`
   * (e.g. `api.example.com`, `%.amazonaws.com`).
   *
   * @param domain - The hostname or wildcard pattern to look up.
   * @returns `true` if the pattern is found in at least one `ProxyEndpoint` CR,
   *          `false` otherwise.
   */
  isDomainAllowed(domain: string): Promise<boolean>;

  /**
   * Checks whether a `ProxyEndpoint` CR with the given name exists.
   *
   * @param name - The metadata name of the `ProxyEndpoint` CR to look up.
   * @returns `true` if the CR exists, `false` if it is not found.
   */
  hasProxyEndpoint(name: string): Promise<boolean>;

  /**
   * Builds the `/meta/proxy` URL and auth headers for the given options
   * without dispatching a request.
   *
   * Useful when a caller needs to construct the request itself (e.g. to pass
   * the URL and headers to a third-party HTTP client or an existing `axios`
   * call).
   *
   * @param options - Proxy request options (same as `request()`).
   * @returns An object containing the resolved `url` and `headers`.
   */
  prepareRequest(options: ProxyRequestOptions): { url: string; headers: Record<string, string> };
}
