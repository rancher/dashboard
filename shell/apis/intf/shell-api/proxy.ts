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
   * Optional credential id.
   * This can be a Rancher cloud credential custom resource OR any opaque secret in the cattle-global-data namespace
   * format namespace:name -- namespace required despite always being 'cattle-global-data'
   */
  credentialId?: string;

  /**
   * Selects the signing strategy used to build the `Authorization` header when
   * `credentialId` is provided. Rancher reads the referenced secret and uses
   * its data to sign (or annotate) the upstream request via
   * `X-Api-CattleAuth-Header`.
   *
   * The raw header value sent to the backend has the form:
   * `<signer> credID=<id> [passwordField=<field>] [usernameField=<field>] …`
   *
   * Supported signers:
   * - `bearer`    – Reads `secret[passwordField]` and sets
   *                 `Authorization: Bearer <value>`.
   *                 Requires: `credentialId`, `passwordField`.
   * - `basic`     – Base64-encodes `secret[usernameField]:secret[passwordField]`
   *                 and sets `Authorization: Basic <encoded>`.
   *                 Requires: `credentialId`, `usernameField`, `passwordField`.
   * - `digest`    – Performs HTTP Digest challenge-response auth using
   *                 `secret[usernameField]` and `secret[passwordField]`.
   *                 Requires: `credentialId`, `usernameField`, `passwordField`.
   * - `awsv4`     – Signs the request with AWS Signature V4 using
   *                 `secret['accessKey']` and `secret['secretKey']`.
   *                 Requires: `credentialId` only.
   * - `arbitrary` – Sets arbitrary request headers supplied via the
   *                 `headers` field (comma-separated `Name=Value` pairs).
   *                  Does not use information from a cloud credential.
   *
   * Read the details of signer implementation here: https://github.com/rancher/rancher/tree/fc7f29161513c042d69b334468684d4f691d641e/pkg/httpproxy
   *
   * If omitted and `credentialId` is set, Rancher will forward the raw
   * `credentialId` value as the `Authorization` header without signing.
   */
  authSigner?: 'bearer' | 'awsv4' | 'basic' | 'digest' | 'arbitrary';

  /**
   * Key name inside the credential secret whose value is used as the
   * password (or bearer token) in the generated `Authorization` header.
   *
   * The backend looks up `secret.data[passwordField]` after resolving the
   * secret referenced by `credentialId`. Secret data keys that follow the
   * pattern `<configPrefix>-<key>` (e.g. `amazonecConfig-secretKey`) are
   * normalised to just `<key>` before the lookup.
   *
   * Required by: `bearer`, `basic`, `digest`.
   */
  passwordField?: string,

  /**
   * Key name inside the credential secret whose value is used as the
   * username in the generated `Authorization` header.
   *
   * The backend looks up `secret.data[usernameField]` after resolving the
   * secret referenced by `credentialId`. The same key-normalisation as
   * `passwordField` applies.
   *
   * Required by: `basic`, `digest`.
   */
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

  /**
   * HTTP method for the upstream request. Defaults to `GET` when omitted.
   */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

}

export interface ProxyApi {
  /**
   * Generic helper for requests sent through Rancher `/meta/proxy`.
   *
   * Supports:
   * - standard `/meta/proxy` requests via `management/request`
   * - auth header helpers for direct token (`X-API-Auth-Header`) or
   *   cloud credential based auth (`X-Api-CattleAuth-Header`)
   */
  request(options: ProxyRequestOptions): Promise<any>;

  /**
   * Creates a `ProxyEndpoint` CR (`management.cattle.io/v3`) that adds the
   * given domains to the Rancher `/meta/proxy` allow-list.
   *
   * Each entry in `urls` should be a bare hostname or a wildcard pattern
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
}
