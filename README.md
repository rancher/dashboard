# dashboard
[![Build Status](http://drone-publish.rancher.io/api/badges/rancher/dashboard/status.svg)](http://drone-publish.rancher.io/rancher/dashboard)

Dashboard UI.  For the other Rancher UI see [rancher/ui](https://github.com/rancher/ui).

## Build Setup

```bash
# install dependencies
$ yarn install

# serve with hot reload at https://localhost:8005
# using the endpoint for your Steve (or Rancher) API
$ API=http://localhost:8989 yarn devx

# build for production and launch server
$ yarn build
$ yarn start

# generate static project
$ yarn generate
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

 ## Running with standalone Steve on a Mac
 ```bash
 cd steve
 make run-host

 cd dashboard
 docker build -f Dockerfile.dev -t rancherlabs/dashboard:dev
 docker run -v $(pwd):/src \
   -v dashboard_node:/src/node_modules \
   -p 8005:8005 \
   -e API=http://172.17.0.1:8989 \
   rancherlabs/dashboard:dev
 
 # The first time will take forever installing node_modules into the volume; it will be faster next time.
 #
 # Goto https://localhost:8005
```

### Creating a Steve user

Steve does not currently create any default user to login to when it is first run.  Use kubectl to apply this to create an `admin`/`admin` user:

```yaml
  ---
  apiVersion: management.cattle.io/v3
  kind: User
  metadata:
    name: admin
  principalIds:
    - local://admin
  enabled: true
  username: admin
  # bcrypt hash of "admin" , or use e.g. https://bcrypt-generator.com/ to generate your own
  password: $2a$10$lQpf/73orx5T3TBzbu.xNOXFgODGsR4wc39vTGc6Hbt8cdQVza.Pq
  ---
  apiVersion: rbac.authorization.k8s.io/v1
  kind: ClusterRoleBinding
  metadata:
    name: default-admin
  roleRef:
    apiGroup: rbac.authorization.k8s.io
    kind: ClusterRole
    name: cluster-admin
  subjects:
  - apiGroup: rbac.authorization.k8s.io
    kind: User
    name: admin
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
