# Development Environment

This is part of the developer [getting started guide](https://github.com/rancher/dashboard/blob/master/README.md).

> Note: Development is only currently supported on Mac and Linux. Windows is not currently supported.

## Stack

A good base knowledge of Vue, Vuex and Nuxt should be reached before going through the code. Looking through `nuxt.config.js` is a good way to understand how the Dashboard is glued together, importantly how plugins are brought in and how the frontend proxies requests to Rancher's APIs.

## Helpful links

| Description                       | Link                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Core Vue Docs                     | https://vuejs.org/v2/guide                                                                           |
| Typescript in Vue                 | https://vuejs.org/v2/guide/typescript.html                                                           |
| Vue Template/Directive Shorthands | https://vuejs.org/v2/guide/syntax.html                                                               |
| Vue Conditional rendering         | https://vuejs.org/v2/guide/conditional.html                                                          |
| Vuex Core Docs                    | https://vuex.vuejs.org/                                                                              |
| Nuxt Get Started                  | https://nuxtjs.org/docs/2.x/get-started/installation                                                 |
| Nuxt Structure                    | https://nuxtjs.org/docs/2.x/directory-structure                                                      |
| Axios (HTTP Requests)             | https://axios.nuxtjs.org/options                                                                     |
| HTTP Proxy middleware             | https://github.com/nuxt-community/proxy-module (https://github.com/chimurai/http-proxy-middleware) |

## Platform

The Dashboard is shipped with the Rancher package which contains the Rancher API. When developing locally the Dashboard must point to an instance of the Rancher API.

### Installing Rancher

See https://ranchermanager.docs.rancher.com/getting-started/installation-and-upgrade. Note: Not all Linux distros and versions are supported. To make sure your OS is compatible with Rancher, see the support maintenance terms for the specific Rancher version that you are using: https://www.suse.com/suse-rancher/support-matrix/all-supported-versions

The above linked installation docs cover two methods confirmed to work with the Dashboard:

- [Single Docker Container](https://ranchermanager.docs.rancher.com/getting-started/installation-and-upgrade/other-installation-methods/rancher-on-a-single-node-with-docker)
- [Kube Cluster (via Helm)](https://ranchermanager.docs.rancher.com/getting-started/installation-and-upgrade/install-upgrade-on-a-kubernetes-cluster)

To use the most recent version of Rancher that is actively in development, use the version tag `head` when installing Rancher or check head tags [here](https://hub.docker.com/r/rancher/rancher/tags?page_size=&ordering=&name=head).
For example, the Docker installation command would look like this:

```bash
sudo docker run -d --restart=unless-stopped -p 80:80 -p 443:443 --privileged -e CATTLE_BOOTSTRAP_PASSWORD=OPTIONAL_PASSWORD_HERE rancher/rancher:head
```

Dashboard provides convenience methods to start and stop Rancher in a single docker container

```bash
yarn run docker:local:start
yarn run docker:local:stop  // default user password as "password"
```

Note that for Rancher to provision and manage downstream clusters, the Rancher server URL must be accessible from the Internet. If you’re running Rancher in Docker Desktop, the Rancher server URL is `https://localhost`. To make Rancher accessible to downstream clusters for development, you can:

- Use ngrok to test provisioning with a local rancher server
- Install Rancher on a virtual machine in Digital Ocean or Amazon EC2
- Change the Rancher server URL using `<dashboard url>c/local/settings/management.cattle.io.setting`

Also for consideration:

- [K3d](https://k3d.io/v4.4.8/#installation) lets you immediately install a Kubernetes cluster in a Docker container and interact with it with kubectl for development and testing purposes.

You should be able to reach the older Ember UI by navigating to the Rancher API url. This same API Url will be used later when starting up the Dashboard.

### Uninstalling Rancher

- Docker - This should be a simple `docker stop` & `docker rm`
- Kube Cluster -  Use `helm delete` as usual and then the `remove` command from [System Tools](https://ranchermanager.docs.rancher.com/v2.8/reference-guides/system-tools) client

## UI Walkthrough

An intro to the Rancher UI is [here.](./ui-walkthrough.md)

## Environment

Developers are free to use the IDE and modern browser of their choosing. Here's some tips on some in particular

### VS Code

- Install the `vetur` extension. This contains syntax highlighting, IntelliSense, snippets, formatting, etc)
- Install the `ESLint` extension to underline linting issues. It can also be used to auto-fix errors on save by using **Command + Shift + P > ESLint: Fix all auto-fixable Problems.**
- Install a spell checker, such as `Code Spell Checker`, to catch common spelling mistakes and typos

### Chrome

- Install the Chrome `vue-devtools` extension to view the Vuex store.
  
  > This can consume a lot of the host's resources. It's recommended to pause Vuex history (nav to Vue tab in DevTools and toggle the `Recording` button top right of the history section). Vue devtools will record each mutation, so it's strongly recommended to disable recording early on in debugging, before logging into Rancher. Recording Vuex can then be manually toggled on an as-needed basis to safely investigate shared state

## Running / Debugging Dashboard

### Running the Dashboard

See the [Quickstart](https://extensions.rancher.io/internal/getting-started/quickstart) section on how to bring up the Dashboard locally.

> Troubleshooting: Multiple `Could not freeze errors` in `yarn dev` terminal
>
> This is most probably due to a correct cache in `/node_modules/.cache`. Exit out of `yarn run` and run `yarn run clean` and then try again.

### Debugging the Dashboard

### Breakpoints
Finding the correct file in Dev Tools and reliably setting a breakpoint can be hit and miss, even in SPA mode. It is advised to manually add a `debugger` statement in code instead. 

### Debug Output for kubectl

You can increase the verbosity level of kubectl to see the actual HTTP requests that it makes to the Kubernetes API, including the request and response bodies. For example, to see the request and response for rolling back a workload, you could run:

```bash
kubectl rollout undo deployment/[deployment name] --to-revision=[revision number] -v=8
```

#### GitHub CLI

When reviewing a pull request, it can be useful to pull down someone's PR using the GitHub CLI. For example:

```bash
gh pr checkout 4284
```

The GitHub CLI installation instructions are [here.](https://github.com/cli/cli#installation)


## Working with Different Rancher Versions

Most of the time, you will be working with the Docker install because when you pull a Docker image such as `v2.9-head`, it will be based on the newest version of the `master` branch. By contrast, the Helm chart installs only work with released Rancher versions.

To find the version or age of the Rancher instance that you are working with, click the hamburger menu in the top left corner. At the bottom of the side nav that appears, there is a commit hash. If you click the commit hash, you will see more details that you can use to make sure you are working with the correct Rancher version.

The Rancher UI files are hosted remotely from a location configured in the global Rancher settings. This means it is possible for a Rancher instance to use a newer version of the UI without upgrading Rancher. To see what UI version a specific Rancher instance is using, go to the global settings in Rancher and look at the settings named `ui-dashboard-index ` and `ui-index`. The `ui-dashboard-index` is where the Vue frontend comes from, and the `ui-index` is where the iFramed Ember pages come from. Most of the time, the value for the Vue dashboard points to the `latest` branch because it is built from master, so if you pull a fresh Docker image of Rancher, it will be built from the state of `master` at the time you pull the image. Shortly before a Rancher release, the default setting for the dashboard is changed from `latest` to a released Rancher version.

The UI team tries to avoid branching a release version from `latest` until a short time before a Rancher release in order to prevent merge conflicts. This is something to keep in mind, because if you are working on a feature that is targeted for a future release, but the latest version of Rancher has a released version in the default global settings, you will need to tell QA that they will need to change the global setting to point to the `latest` branch in order to see your changes.

A common mistake is to accidentally work from the wrong Rancher version. Because the Docker images are cached on your machine, the `latest` image will not actually be the latest image unless you force Docker to re-fetch the image. For details on forcing Docker to pull a new image, see these docs: https://docs.docker.com/engine/reference/commandline/pull/

### Upgrading Rancher with Docker

If you want to use a more long-lived Rancher instance, you may need to upgrade Rancher without just killing the container running in Docker. In that case, you can run the script `./scripts/update-docker-image`, or you can follow [these docs](https://ranchermanager.docs.rancher.com/v2.8/getting-started/installation-and-upgrade/other-installation-methods/rancher-on-a-single-node-with-docker/upgrade-docker-installed-rancher) to upgrade Rancher with Docker.

If using the script, you will need to provide 2 arguments:

- A container name to be updated
- An image tag for which to update the container with (e.g. `v2.7-head`)

For instance:

```console
./scripts/update-docker-image my-rancher-instance v2.7-head
```
