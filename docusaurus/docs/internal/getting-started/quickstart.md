# Quickstart

## Running for Development

To get started running the UI for development:

Prerequisites:

* Node 16 (later versions are currently not supported)

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

If `yarn dev` fails with the following error:

```
Error: error:0308010C:digital envelope routines::unsupported
    at new Hash (node:internal/crypto/hash:71:19)
    at Object.createHash (node:crypto:130:10)
    at module.exports (/Users/SMOIOLI/synced/repos/dashboard/node_modules/webpack/lib/util/createHash.js:135:53)
    at NormalModule._initBuildHash (/Users/SMOIOLI/synced/repos/dashboard/node_modules/webpack/lib/NormalModule.js:417:16)
    at handleParseError (/Users/SMOIOLI/synced/repos/dashboard/node_modules/webpack/lib/NormalModule.js:471:10)
    at /Users/SMOIOLI/synced/repos/dashboard/node_modules/webpack/lib/NormalModule.js:503:5
    at /Users/SMOIOLI/synced/repos/dashboard/node_modules/webpack/lib/NormalModule.js:358:12
    at /Users/SMOIOLI/synced/repos/dashboard/node_modules/loader-runner/lib/LoaderRunner.js:373:3
    at iterateNormalLoaders (/Users/SMOIOLI/synced/repos/dashboard/node_modules/loader-runner/lib/LoaderRunner.js:214:10)
    at Array.<anonymous> (/Users/SMOIOLI/synced/repos/dashboard/node_modules/loader-runner/lib/LoaderRunner.js:205:4)
    at Storage.finished (/Users/SMOIOLI/synced/repos/dashboard/node_modules/enhanced-resolve/lib/CachedInputFileSystem.js:55:16)
    at /Users/SMOIOLI/synced/repos/dashboard/node_modules/enhanced-resolve/lib/CachedInputFileSystem.js:91:9
    at /Users/SMOIOLI/synced/repos/dashboard/node_modules/graceful-fs/graceful-fs.js:123:16
    at FSReqCallback.readFileAfterClose [as oncomplete] (node:internal/fs/read_file_context:68:3) {
  opensslErrorStack: [ 'error:03000086:digital envelope routines::initialization error' ],
  library: 'digital envelope routines',
  reason: 'unsupported',
  code: 'ERR_OSSL_EVP_UNSUPPORTED'
}
```

You can force Node to use the legacy openssl provider via:

```
export NODE_OPTIONS=--openssl-legacy-provider
```

The need for this option will be removed as soon as later Node versions get supported.
