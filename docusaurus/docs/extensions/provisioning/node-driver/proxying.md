
# Making API Calls

Rancher routes UI requests to third-party domains (cloud provider APIs, etc.) through its server-side `/meta/proxy` endpoint. This avoids browser CORS restrictions and keeps cloud credentials out of the browser.

The recommended way to make these requests is through the **`shell.proxy` API**, available via `this.$shell.proxy` in components and store actions.

## Allow lists

> **Important: the target hostname must be on Rancher's proxy allow-list or the request will be denied (HTTP 503).**

Hostnames are allowed via `ProxyEndpoint` custom resources (`management.cattle.io/v3`). The `shell.proxy` API provides two ways to check whether a domain is already registered, with different performance characteristics:

| Method | How it works | Performance |
|---|---|---|
| `hasProxyEndpoint(name)` | Fetches a single CR by name | preferred |
| `isDomainAllowed(domain)` | Fetches **all** `ProxyEndpoint` CRs and scans every route entry for an exact match | may be expensive — use wisely |

Extension developers should create their own `ProxyEndpoint` CR with a well-known, stable name, then use `hasProxyEndpoint` to check for it. This avoids the full-list fetch that `isDomainAllowed` requires.

```ts
const CR_NAME = 'my-extension-endpoints';


const exists = await this.$shell.proxy.hasProxyEndpoint(CR_NAME);

if (!exists) {
  await this.$shell.proxy.allowDomains(['api.example.com'], CR_NAME);
}
```

Use `isDomainAllowed` only when you do not control the CR name — for example when checking whether a domain was registered by a built-in Rancher `ProxyEndpoint` or another extension. Note that multiple ProxyEndpoints may allow the same domain: you may choose to register your own list of domains for your extension regardless of existing allow-lists.

```ts
// fetches and iterates through all ProxyEndpoint CRs
const allowed = await this.$shell.proxy.isDomainAllowed('api.example.com');
```

## Making requests

Use `this.$shell.proxy.request(options)` to send a proxied request. The API builds the `/meta/proxy/…` URL and auth headers for you.

### Simple GET with a cloud credential (bearer token)

```ts
const result = await this.$shell.proxy.request({
  url:            new URL('https://api.example.com/v1/regions'),
  authentication: {
    id:            myCloudCredentialId,
    authSigner:    'bearer',
    passwordField: 'token',
  },
});
```

### GET with a plain token

```ts
const result = await this.$shell.proxy.request({
  url:            new URL('https://api.example.com/v1/images'),
  authentication: { token: myApiToken },
});
```

### Automatic de-pagination

Use `createDepaginator` (imported from `@shell/apis/shell/proxy`) to follow paginated responses automatically:

```ts
import { createDepaginator } from '@shell/apis/shell/proxy';

const baseUrl = new URL('https://api.example.com/v1/instances');
baseUrl.searchParams.set('per_page', '200');

const baseOptions = {
  url:            baseUrl,
  authentication: {
    id:            myCloudCredentialId,
    authSigner:    'bearer',
    passwordField: 'token',
  },
};

const allItems = await this.$shell.proxy.request({
  ...baseOptions,
  postProcess: createDepaginator(
    this.$shell.proxy,
    baseOptions,
    { nextUrlPath: 'links.pages.next', mergeKey: 'instances' },
  ),
});
```

### POST request

```ts
const token = await this.$shell.proxy.request({
  url:            new URL('https://auth.example.com/oauth/token'),
  method:         'POST',
  authentication: { token: base64Credentials, authSigner: 'basic' },
});
```

## URL format

The proxy accepts paths of the form `/meta/proxy/<host>/<path>`. The `shell.proxy` API constructs this automatically. For reference:

- TLS on port 443 is assumed by default.
- To use a different port: `example.com:1234/path`.
- For plain HTTP *(avoid where possible)*: `http:/example.com:1234/path` (one slash after `http:`).

## Headers

Most request headers are forwarded unchanged to the upstream target. A small number of sensitive Rancher-internal headers (session cookies, saved basic-auth credentials) are stripped before forwarding. If you send an `X-Api-Cookie-Header`, its value will be sent as the normal `Cookie` to the target. Two special substitution headers are also available:

| Header | Behaviour |
|---|---|
| `X-Api-Cookie-Header` | Its value is sent to the upstream as the standard `Cookie` header. |
| `X-API-Auth-Header` | Its value is sent to the upstream as the standard `Authorization` header. |

`shell.proxy` manages both auth headers for you — you never need to set them manually. Pass an `authentication` object containing either `token` (for plain-token auth) or `id` (for cloud-credential auth) and the correct header is constructed automatically.

### Plain-token authorization (`X-API-Auth-Header`)

When you supply a `token`, `shell.proxy` sets `X-API-Auth-Header` to `<scheme> <token>`, where `<scheme>` is the value of `authSigner` (defaults to `Bearer`):

```ts
// Produces: X-API-Auth-Header: Bearer eyJh...
await this.$shell.proxy.request({
  url:            new URL('https://api.example.com/v1/images'),
  authentication: {
    token:      myApiToken,
    // authSigner defaults to 'Bearer' — override as needed, e.g. 'basic'
  },
});
```

The proxy strips this header before forwarding and re-emits the value as a standard `Authorization` header to the upstream.

Supported `authSigner` values: `bearer`, `basic`, `digest`, `awsv4`, `arbitrary`.

### Authorization with Cloud Credentials (`X-Api-CattleAuth-Header`)

When your request must be authenticated using data stored in a Rancher Cloud Credential, pass a `credentialId` instead of a raw `token`. Rancher's backend will look up the credential secret, extract the relevant fields, and sign the upstream request — the browser never sees the secret value. Arbitrary opaque secrets may be used here as well, though they must exist in the `cattle-global-data` namespace.

`shell.proxy` sets the `X-Api-CattleAuth-Header` request header, which has the following space-delimited format:

```
<signer> credID=<credentialId> [usernameField=<field>] [passwordField=<field>]
```

| Header Part |  `authentication` field | Description |
|---|---|---|
| `<signer>` | `authSigner` | How to sign the upstream request (`bearer`, `basic`, `awsv4`, etc.). |
| `credID` | `id` | ID of the Cloud Credential resource (`management.cattle.io/v3/cloudcredentials/<id>`). |
| `usernameField` | `usernameField` | Key inside the credential secret to use as the username / access-key.* |
| `passwordField` | `passwordField` | Key inside the credential secret to use as the password / secret-key.* |



The Rancher backend parses this header, reads the named fields from the stored secret, and assembles the final `Authorization` header before forwarding the request upstream. For example, using the `bearer` signer with `passwordField: 'token'` causes Rancher to produce `Authorization: Bearer <value-of-token-field>`.

* cloud credentials' sensitive data are stored in Kubernetes secrets. The keys in the secret data are prefixed with the type of the cloud credential, e.g. accessToken is stored as `digitaloceanCredentialConfig-accessToken`. That credential configuration prefix is stripped by the Rancher backend: $shell.proxy.request should be invoked with `passwordField: 'accessToken'` in this example.

```ts
// The backend looks up the Cloud Credential, reads the 'token' field, and
// produces: Authorization: Bearer <token-field-value>
await this.$shell.proxy.request({
  url:            new URL('https://api.example.com/v1/regions'),
  authentication: {
    id:            myCloudCredentialId,
    authSigner:    'bearer',
    passwordField: 'token',
  },
});
```

For API-key style credentials where the upstream expects both a username and a password:

```ts
// The backend assembles Basic auth from the two credential fields
await this.$shell.proxy.request({
  url:            new URL('https://api.example.com/v1/locations'),
  authentication: {
    id:            myCloudCredentialId,
    authSigner:    'basic',
    usernameField: 'clientId',
    passwordField: 'clientSecret',
  },
});
```

For AWS credentials, use `awsv4` — the signer reads the access key and secret key from the credential and constructs a full SigV4-signed request:

```ts
await this.$shell.proxy.request({
  url:            new URL('https://ec2.us-east-1.amazonaws.com/DescribeRegions'),
  authentication: {
    id:            myCloudCredentialId,
    authSigner:    'awsv4',
    usernameField: 'accessKey',
    passwordField: 'secretKey',
  },
});
```
