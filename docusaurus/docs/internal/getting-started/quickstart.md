# Quickstart

## Running for Development

To get started running the UI for development:

Prerequisites:

* Node 24 (the version pinned in `.nvmrc`)

* yarn:
  ```npm install --global yarn```

Run:

```bash
# Install dependencies
yarn install

# For development, serve with hot reload at https://localhost:8005
# using the endpoint for your Rancher API
API=https://your-rancher yarn dev
# or put the variable into a .env file
# Goto https://localhost:8005
```

> Note: `API` is the URL of a deployed Rancher environment (backend API)

## Troubleshooting

### `ERR_OSSL_EVP_UNSUPPORTED` on older release branches

Release branches 2.9 and earlier build with webpack 4, which fails on Node 17 and later. If `yarn dev` on one of those branches fails with the following error:

```
Error: error:0308010C:digital envelope routines::unsupported
    at new Hash (node:internal/crypto/hash:71:19)
    at Object.createHash (node:crypto:130:10)

...

    at FSReqCallback.readFileAfterClose [as oncomplete] (node:internal/fs/read_file_context:68:3) {
  opensslErrorStack: [ 'error:03000086:digital envelope routines::initialization error' ],
  library: 'digital envelope routines',
  reason: 'unsupported',
  code: 'ERR_OSSL_EVP_UNSUPPORTED'
}
```

Use Node 16 (pinned in release-2.9's `.nvmrc`). If you have to use a newer Node, force it to use the legacy OpenSSL provider:

```
export NODE_OPTIONS=--openssl-legacy-provider
```

`master` and release branches 2.10 and later use webpack 5 and do not need this.
