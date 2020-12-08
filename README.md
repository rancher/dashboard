# Rancher Dashboard
[![Build Status](http://drone-publish.rancher.io/api/badges/rancher/dashboard/status.svg)](http://drone-publish.rancher.io/rancher/dashboard)

Rancher Dashboard UI, a.k.a Cluster Explorer.
For the other Rancher UI (Cluster Manager) see [rancher/ui](https://github.com/rancher/ui).

## Running for development
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

## Other building modes
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
docker build -f Dockerfile.dev -t dashboard:dev
docker run -v $(pwd):/src \
  -v dashboard_node:/src/node_modules \
  -p 8005:8005 \
  -e API=https://your-rancher \
  dashboard:dev
# The first time will take *forever* installing node_modules into the volume; it will be faster next time.
# Goto https://localhost:8005
```

## What is it?

Dashboard is "stateless" client for the Rancher APIs built with [Vue.js](https://vuejs.org/) and [NuxtJS](https://nuxtjs.org/).  It is normally build and packaged as a folder of static HTML/CSS/JS files which are bundled into a Rancher release, with the index.html returned by the API server as the "fallback" case for any request that looks like it came from a browser and does not match an API URL.

## Directory Structure

The directory structure is mostly flat, with each top level dir being for a different important thing (or just requied by Nuxt to be there).

### Customizing how k8s resources are presented

These are where you do most of the daily work of customizing of how a particular k8s resource is presented.

Path | Used for
-----|---------
config | Configuration of how products look and work; constants for labels, types, cookies, query params, etc that are used
chart | Custom components to present when installing a Product chart
detail | Custom components to show as the detail view for a particular resource instance
edit | Custom components to show as the edit (or view config) view for a particular resource instance
list | Custom components to show as the list view for a resource type
models | Custom logic extending the standard `resource-instance` "class" for each API type and model returned by the API

### Other commonly changed stuff

Path | Used for
-----|---------
assets | CSS, fonts, images, translations, etc resoruces which get processed during build
components | All general components which don't have a separate special directory elsewhere
layouts | The outermost components for rendering different kinds of pages (Nuxt)
store | [Vuex](https://vuex.vuejs.org/) stores which maintain all the state for the life of a page load
utils | Misc parsers, utilities, and other (usually) standalone code that doesn't fit anywhere else

### The rest
These are mostly standard Nuxt dirs that you won't need to go into very often.

Path | Used for
-----|---------
static | Static files which get directly copied into the build with no processing
middleware | Hooks called on every page load
mixins | Code that is defined once and then applied to several different other components
pages | The structure in here defines the routes that are available, and what gets rendered when one is hit
plugins | Add-ons to modify vue/nuxt or load additional 3rd-party code.  The "steve" API client also notably lives here.
scripts | Shell scripts for building and related tasks, used by CI and `npm run ...` commands
server | Server-side middleware and dev SSL cert
test | Unit tests (or lack thereof)

## APIs
There are lots of different APIs available in Rancher, but the primary two are [Norman](https://github.com/rancher/norman) and [Steve](https://github.com/rancher/steve):
  - Norman is older and mainly used by the [Ember UI](https://github.com/rancher/ui).  It presents an opinionated view of some of the common resources in a Kubernetes cluster, with lots of features to make the client's life easier.  Fields are renamed to be named more consistently, deeply-nested structures are flattened out somewhat, complicated multi-step interactions with the k8s API are orchestrated in the server and hidden from you, etc.  It attempts to bridge the gap from Rancher 1.x's usability, and is quite nice if it does what you need.  But _only_ the types that Norman supports are exposed, and you can _only_ interact with the resources in the namespaces assigned to a Project.  Types Norman doesn't know about and namespaces not assigned to a project are effectively invisible.
  - Steve is newer, and the primary one used here.  It works in the opposite direction, starting with a completely unopinionated view of every resource available in a cluster, and then adding custom logic only where needed.  Every type and every namespace are directly addressible.  This still adds some critical functionality over directly talking to the k8s API, such as:
      - It's presented following our [api-spec](https://github.com/rancher/api-spec), so the same client libraries work for any of our APIs, including the in-browser generic [api-ui](https://github.com/rancher/api-ui).
      - "Watches" to find out when a resource changes are aggregated into a single websocket which keeps track of what's connected and can resume the stream, rather than many independent calls to the native k8s implementation
      - The "counts" resource internally watches everything to keep track of how many of every type of resource there are in every namespace and state, which allows us to show all the types that are "in use" and how many there are in the left nav.
      - Schemas and links on each resource efficiently identify what permissions the user making the request has, so that actions in the UI can be hidden or disabled if not allowed for the current user instead of letting them try and having the server reject it.
      - Normalizing the differnet and sometimes inconsistent state/status/conditions data from resources into a single logical view of the world the UI can present.
      - RPC-style actions to do more complicated workflows on the server side when appropriate

### Endpoints

In a production setup these are all handled natively by Rancher.  For development of dashboard, they are proxied to the Rancher install that the `API` environment variable points at.

Endpoint                 | Notes
-------------------------|-------
`/v3`                    | Norman API
`/v3-public`             | Norman unauthenticated API (mostly for info required to login)
`/v1`                    | Steve API for the management ("local") cluster
`/k8s/clusters/<id>`     | Proxy straight to the native k8s API for the given downstream cluster
`/k8s/clusters/<id>/v1`  | Steve API for given downstream cluster via the server proxy

## Customizing resource views

@TODO Detail, edit, list, chart components and product config

## Vuex Stores

@TODO
action-menu
auth
catalog
github
growl
i18n
index
prefs
shell
type-map
wm

management
cluster
rancher

## Steve Client

@TODO How types are managed & synched, models, websocket, making API calls

## Internationalization (i18n)

Any code producing messages, labels, numbers, dates, times, and the like should use the `i18n` store and translation strings to generate and format them instead of hardcoding English or American-isms anywhere.   Messages and number formatting uses [ICU templating](https://formatjs.io/docs/intl-messageformat) for very powerful pluralization and customizing.

The `assets/translations` dir stores a YAML file with translations for each supported language.
  - English is automatically used as the "fallback" if a particular key is missing from a non-English language.
  - If you don't have a native translation for a particular key, just leave that key out of the language
  - Do not duplicate the English string into other languages.

Translations should be the largest phrase that makes sense as a single key, rather than several separate things rendered in a fixed order.
  - For example "about 2 minutes remaining" should be a single translation: `About {n, number} {n, plural, one { minute }, other { minutes }} remaining`.
  - Not one for `About`, one for `minute`, one for `minutes`, one for `remaining`, and some code picking and choosing which to concatenate.

## Server-Side-Rendering (SSR)

Nuxt supports server-side-rendering (SSR), where a node.js server runs the UI code on the server-side and responds with the fully-baked HTML of the desired page.  This allows it to make all the necessary API calls directly "to itself", with less latency, versus serving up an empty page which loads all the JS, then starts making API calls accross the slower server<->user connection.

But actually using this mode would require a node.js process (with sometimes considerable overhead) running inside of every Rancher container, and coordination with Rancher to proxy requests that should be for the UI to it.  So we don't actually ship anything using this mode, Rancher releases use single-page-app (SPA) mode only.

We have no concrete plans for this, but can envision several situations where we might want to use SSR in the future, so maintaining the functionality is an engineering priority.  Therefore SSR is on by default for development, and you should keep it that way in general.  It is relatively easy to write something that will break in SSR, and if not exercised we'd end up with many different slightly broken things that add up to a large effort to ever get it running again if needed.

To disable it for the whole server for development, add `--spa`.  To disable it for a single page load, add `?spa` (or `&spa`) to the query string.  It is harder, but possible, to write something that works in SSR but breaks in SPA, so these are good for debugging issues.

### Multiple GitHub auth configs
The auth system supports multiple GitHub auth URLs and using the appropriate one based on the Host header that a request comes in on.  Configuring this is not exposed in the regular UI, but is particularly useful for development against a server that already has GitHub setup.

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
