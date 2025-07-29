
# Making API Calls

Rancher includes a proxy that can be used to make requests to third-party domains (like a cloud provider's API) without requiring that the other end supports CORS or other browser shenanigans.  Send requests to `/meta/proxy/example.com/whatever/path/you/want` and the request will be made from the Rancher server and proxied back to you.

TLS and port 443 are assumed.  Add a port after the hostname to change the port (`example.com:1234`).

Plain HTTP (i.e. not HTTPS) calls can be made - but you should *carefully* consider doing so. For this, use `/meta/proxy/http:/example.com:1234` (note one slash after `http:`, not two). 

## Allow lists

> **Important: Please be aware of the allow list restrictions below**

API calls can ONLY be made to hostnames that have specifically been allowed in Rancher. This is done by including the hostname in the whitelist defined in global settings, or in the configuration for an active node driver.  If if isn't your request will be denied.  (This prevents a malicious (non-admin) user from abusing the Rancher server as an arbitrary HTTP proxy or reach internal IPs/names that the server can reach directly but the user can't from the outside.) Typically API requests to hosts not in the allow-list will return a 503 HTTP status code. 

The rest of the path and query string are sent to the target host as you'd expect.

Normal headers are copied from your request and sent to the target.  There are some exceptions for sensitive fields like the user's rancher cookies or saved basic auth creds which will not be copied.  If you send an `X-Api-Cookie-Header`, its value will be sent as the normal `Cookie` to the target.  If you send `X-API-Auth-Header`, that will be sent out as the normal `Authorization`.

But normally you want to make a request using a Cloud Credential as the authorization, without knowing what the secret values in that credential are.  You ask for this by sending an `X-Api-CattleAuth-Header` header.  The value of the header specifies what credential Id to use, and a [signer](https://github.com/rancher/rancher/blob/release/v2.6/pkg/httpproxy/sign.go) which describes how that credential should be injected into the request.

Common options include `awsv4` (Amazon's complicated HMAC signatures), `bearer`, `basic`, and `digest`.

For example if you send:

`X-Api-CattleAuth-Header: Basic credId=someCredentialId usernameField=user passwordField=pass`

Rancher will retrieve the credential with id `someCredentialId`, read the values of the `user` and `pass` fields from it and add the header:

`Authorization: Basic <base64(user + ":" + pass)>`

to the proxied request for you.
