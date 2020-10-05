# dashboard
[![Build Status](http://drone-publish.rancher.io/api/badges/rancher/dashboard/status.svg)](http://drone-publish.rancher.io/rancher/dashboard)

Dashboard UI.  For the other Rancher UI see [rancher/ui](https://github.com/rancher/ui).

## Build Setup

```bash
# Install dependencies
yarn install

# For development, serve with hot reload at https://localhost:8005
# using the endpoint for your Rancher API
API=https://your-rancher yarn dev
# Goto https://localhost:8005

# Build for use within Rancher
./scripts/build-embedded # for embedding into rancher builds
./scripts/build-hosted # for hosting on a static file webserver and pointing Rancher's ui-dashboard-index at it
# Output in dist/

# Build for production and launch nodejs server
# (Rancher does not currently use this mode or server-side rendering)
yarn build
yarn start

# Development via Docker instead of local nodejs
docker build -f Dockerfile.dev -t dashboard:dev
docker run -v $(pwd):/src \
  -v dashboard_node:/src/node_modules \
  -p 8005:8005 \
  -e API=https://your-rancher \
  dashboard:dev
# The first time will take forever installing node_modules into the volume; it will be faster next time.
# Goto https://localhost:8005

```

## Multiple GitHub auth configs
Auth supports multiple GitHub auth URLs and using the appropriate one based on the Host header that a request comes in on.  This is particularly useful for development against a server that already has GitHub setup.

In `management.cattle.io.authconfig`, edit the `github` entry.  Add a `hostnameToClientId` map of Host header value -> GitHub client ID:

```yaml
hostnameToClientId:
  "localhost:8005": <your GitHub Client ID for localhost:8005>
```

In the `secret`, namespace `cattle-global-data`, edit `githubconfig-clientsecret`.  Add GitHub client ID -> base64-encoded client secret to the `data` section:

```yaml
data:
  clientsecret: <the normal client secret already configured>
  <your client id>: <your base64-encoded client secret for localhost:8005>
 ```

License
=======
Copyright (c) 2014-2020 [Rancher Labs, Inc.](http://rancher.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
