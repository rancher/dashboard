# Rancher Dashboard
[![Build Status](http://drone-publish.rancher.io/api/badges/rancher/dashboard/status.svg)](http://drone-publish.rancher.io/rancher/dashboard)

Rancher Dashboard UI, a.k.a Cluster Explorer.
For the other Rancher UI (Cluster Manager) see [rancher/ui](https://github.com/rancher/ui).

## Plugins
During the transition to the new folder structured in 2.6.5 required by the plugin work ...
- Run the script `./scripts/rejig` to move folders to their new location in the `shell` folder and update the appropriate import statements
  Use this to convert older PRs to the new format
- Run the script `./scripts/rejig -d` to move folders to their old location and update imports again
  Use this to convert newer branches to the old format (possibly useful for branches) 

For more information on plugins see [Plugins](./docs/developer/PLUGINS).

## Running for Development
This is what you probably want to get started.
```bash
# Install dependencies
yarn install

# For development, serve with hot reload at https://localhost:8005
# using the endpoint for your Rancher API
API=https://your-rancher yarn dev
# or put the variable into a .env file
# Goto https://localhost:8005
```
For single page app mode, run `API=https://your-rancher yarn dev --spa`.

## Other Building <odes
```bash
# Build for standalone use within Rancher
# (These are done on commit/tag via Drone)
./scripts/build-embedded # for embedding into rancher builds
./scripts/build-hosted # for hosting on a static file webserver and pointing Rancher's ui-dashboard-index at it
# Output in dist/

# Build and run with server-side-rendering
# (This method and SSR are not currently used, but should be maintained for future)
yarn build
yarn start

# Develop via Docker instead of a local nodejs
docker build -f Dockerfile.dev -t dashboard:dev .
docker run -v $(pwd):/src \
  -v dashboard_node:/src/node_modules \
  -p 8005:8005 \
  -e API=https://your-rancher \
  dashboard:dev
# The first time will take *forever* installing node_modules into the volume; it will be faster next time.
# Goto https://localhost:8005

# Developing against a standalone "Steve" API on a Mac
git clone https://github.com/rancher/steve.git
cd steve
make run-host

cd dashboard
docker build -f Dockerfile.dev -t rancher/dashboard:dev .
docker run -v $(pwd):/src \
  -v dashboard_node:/src/node_modules \
  -p 8005:8005 \
  -e API=http://172.17.0.1:8989 \
  rancher/dashboard:dev
# The first time will take *forever* installing node_modules into the volume; it will be faster next time.
# Goto https://localhost:8005
```

# What is it?

Dashboard is "stateless" client for the Rancher APIs built with [Vue.js](https://vuejs.org/) and [NuxtJS](https://nuxtjs.org/).  It is normally built and packaged as a folder of static HTML/CSS/JS files which are bundled into a Rancher release, with the index.html returned by the API server as the "fallback" case for any request that looks like it came from a browser and does not match an API URL.

Every k8s type, namespace, and operation that the logged in user has been granted access to is shown to them.  The default view for everything is the raw YAML from the k8s API for detail pages, and the `Table` view column data for list pages (i.e. what you get from `kubectl get <type> -o wide`).

From there we can customize anything from what columns are shown and in what format to complete custom forms for graphically editing that resource instead of editing YAML.

## Developer Docs

For information on APIs, the layout of the codebase, Vuex stores, localization and more, see the [developer docs.](./docs/developer)

## Contributing

For developers, after reading through the introduction on this page, head over to our [Getting Started](./docs/developer/getting-started) guide to learn more.

License
=======
Copyright (c) 2014-2021 [Rancher Labs, Inc.](http://rancher.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
