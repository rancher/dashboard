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
 *   upstream requests with a Cloud Credential
 */
export interface ProxyRequestOptions {
  /**
   * Full URL for the upstream request. If set, this takes precedence over
   * `endpoint` + `command`.
   */
  url?: string;

  /**
   * Upstream API endpoint (without scheme), for example `api.linode.com/v4`.
   */
  endpoint?: string;

  /**
   * Optional command/path appended to `endpoint`.
   */
  command?: string;

  /**
   * Query params appended to generated endpoint URLs.
   */
  params?: Record<string, any>;

  /**
   * If provided, adds `per_page` to generated endpoint URLs.
   */
  perPage?: number;

  /**
   * Optional cloud credential id.
   * This can be a cloud credential OR any opaque secret in the cattle-global-data namespace
   * format namespace:name -- namespace required despite always being 'cattle-global-data' //TODO nb ask be if this is intentional
   */
  credentialId?: string;

  /**
   * Credential mode used when `credentialId` is provided.
   * `bearer` generates: `Bearer credID=<id> passwordField=<field>`
   * `awsv4` generates: `awsv4 credID=<id>`
   * `basic` generates: `Basic credID=<id> passwordField<field>`
   * //TODO nb document other signers from https://github.com/rancher/rancher/blob/main/pkg/httpproxy/sign.go
   * // TODO nb which signer is default?
   */
  authSigner?: 'bearer' | 'awsv4' | 'basic' | 'digest' | 'arbitrary';

  // TODO nb document these fields: used to retrieve data from secrets to include in generated auth header as username=... password=...
  passwordField?: string,

  usernameField?: string,

  /**
   * Optional token auth value.
   */
  token?: string;

  /**
   * Additional headers to merge with generated auth headers.
   */
  headers?: Record<string, string>;

  /**
   * Accept header value. Default: `application/json`.
   */
  accept?: string;

  /**
   * If true, recursively follows `next` links.
   */
  dePaginate?: boolean;

  /**
   * Dot-path to the next URL field. Default: `links.pages.next`.
   */
  nextUrlPath?: string;

  /**
   * Optional response key used to merge arrays while de-paginating.
   */
  mergeKey?: string;

  /**
   * Optional in-progress output used for de-pagination.
   */
  out?: any;

}

export interface ProxyApi {
  /**
   * Builds or returns a proxy URL/path.
   *
   * Typical usage is to generate paths under `/meta/proxy/...`.
   */
  url(path: string): string;

  /**
   * Generic helper for requests sent through Rancher `/meta/proxy`.
   *
   * Supports:
   * - standard `/meta/proxy` requests via `management/request`
   * - auth header helpers for direct token (`X-API-Auth-Header`) or
   *   cloud credential based auth (`X-Api-CattleAuth-Header`)
   */
  request(options: ProxyRequestOptions): Promise<any>;
}
