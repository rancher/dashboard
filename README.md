# dashboard
[![Build Status](http://drone-publish.rancher.io/api/badges/rancher/dashboard/status.svg)](http://drone-publish.rancher.io/rancher/dashboard)

Dashboard UI.  For the other Rancher UI see [rancher/ui](https://github.com/rancher/ui).

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
Auth supports multiple GitHub auth URLs and using the appropriate one based on the Host header that a request comes in on.  This is particularly useful for development against a server that already has GitHub setup.

In `management.cattle.io.authconfig` `github`, add a `hostnameToClientId` map of Host header value -> GitHub client ID:

```yaml
hostnameToClientId:
  "localhost:8005": <your GitHub Client ID for localhost:8005>
```

And then in the `secret` in namespace `cattle-global-data` called `githubconfig-clientsecret`, add GitHub client ID -> base64-encoded client secret to the `data` section:

```yaml
data:
  clientsecret: <the normal client secret already configured>
  <your client id>: <your base64-encoded client secret for localhost:8005>
 ```

 ## Running with standalone Steve on a Mac
 ```bash
 cd steve
 make run-host

 cd dashboard
 docker build -f Dockerfile.dev -t rancherlabs/dashboard:dev
 docker run -v $(pwd):/src -v dashboard_node:/src/node_modules -p 8005:8005 -e API=http://172.17.0.1:8989 rancherlabs/dashboard:dev
 #
 # The first time will take forever installing node_modules into the volume, it will be faster next time.
 #
 # Goto https://localhost:8005


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
