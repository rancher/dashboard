# dashboard
[![Build Status](http://drone-publish.rancher.io/api/badges/rancher/dashboard/status.svg)](http://drone-publish.rancher.io/rancher/dashboard)

Rio Dashboard UI.  For Rancher UI see [rancher/ui](https://github.com/rancher/ui).

## Build Setup

``` bash
# install dependencies
$ yarn install

# serve with hot reload at https://localhost:8005
$ API=http://localhost:8005 yarn dev

# build for production and launch server
$ yarn build
$ yarn start

# generate static project
$ yarn generate
```

## Multiple GitHub auth configs
Rio auth supports multiple GitHub auth URLs and using the appropriate one based on the Host header that a request comes in on.  This is particularly useful for development against a server that already has GitHub setup.

In `management.cattle.io.v3.authconfig` `github`, add a `hostnameToClientId` map of Host header value -> GitHub client ID:

```yaml
hostnameToClientId:
  "localhost:8005": <your GitHub Client ID for localhost:8005>
```

And then in the `core.v1.secret` in namespace `cattle-global-data` called `githubconfig-clientsecret`, add GitHub client ID -> base64-encoded client secret to the `data` section:

```yaml
data:
  clientsecret: <the normal client secret already configured>
  <your client id>: <your base64-encoded client secret for localhost:8005>
 ```
