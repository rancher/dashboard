# Building an Image for Container Registries

Sometimes you may need to have a custom version of the dashboard that is packaged alongside Rancher to be hosted within Github's [container registry](https://docs.github.com/en/packages). There are a few use cases for this, for instance when developing a package/product for Rancher that doesn't need to be standalone or when it isn't necessary for the package to exist in the Dashboard by default.

---

## Prerequisites

- A branch on the [Dashboard repo](https://github.com/rancher/dashboard) to store the custom dashboard
- A target repository where the dashboard will be added as a submodule
- Access to the target repository actions with a [PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) to authenticate from within the action

---

## Steps

### 1. Add branched repo as a submodule

Run the following to [add a submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules) to your target repo:

```sh
git submodule add <branch-repo-path>
```

This will generate a config file `.gitmodules` in the root directory, it will contain the path of the submodule and the url of the repo. In order to target a specific branch you will need to add a `branch` property to this file. For instance:

```
[submodule "dashboard"]
	path = dashboard
	url = https://github.com/rancher/dashboard.git
	branch = <target-branch>
```

Push these changes to the target repo and you will now see the submodule with the `path` you specified in `.gitmodules`.

### 2. Create Dockerfile to build Rancher image

Create a new [Dockerfile](https://docs.docker.com/engine/reference/builder/) in your branched repo that will build both the frontend from your branch and the main Rancher image. It will need to replace the dashboard files in the Rancher image with the build from the new frontend.

```Dockerfile
# /Dockerfile.example

FROM node:lts AS builder

WORKDIR /src

COPY . .
RUN yarn --pure-lockfile install

ENV ROUTER_BASE="/dashboard"
RUN yarn run build --spa

FROM rancher/rancher:v2.6.3
WORKDIR /var/lib/rancher
RUN rm -rf /usr/share/rancher/ui-dashboard/dashboard*
COPY --from=builder /src/dist /usr/share/rancher/ui-dashboard/dashboard
```

This will build the frontend from your branch with `RUN yarn run build --spa` and replace the dashboard in the Rancher image with `COPY --from=builder /src/dist /usr/share/rancher/ui-dashboard/dashboard`.

### 3. Create action to dispatch the image

In order to make publishing the new package to the Github Registry automatic you will need to create an action that will build the new Rancher image from your submodule's Dockerfile and dispatch the image into a package.

Create two new directories in your target repo:

```/.github/workflows```

Add a new YAML file in the `workflow` directory:

```yml
# /.github/workflows/build-image.yml

name: Dispatch Dashboard image

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
    
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }} # The target repo

jobs:
  build:
    name: Build Dashboard image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v2
        with:
          token: ${{ secrets.WORKFLOW_PAT }} # The PAT referenced in prerequisites
          submodules: recursive # If the repo has multiple submodules to checkout
      
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v1
        
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v1

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v1
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }} # This is the repo owner
          password: ${{ secrets.GITHUB_TOKEN }} # A token generated during the workflow

      - name: Build and push Dashboard image
        uses: docker/build-push-action@v2        
        with:
          context: ./dashboard # Context for docker to find the Dockerfile in the submodule
          file: ./dashboard/Dockerfile.example # Dockerfile you created
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest 
```

We are using [`docker/build-push-action@v2`](https://github.com/docker/build-push-action#usage) to do the heavy lifting for us. This file will create a new package any time a `push` or `pull request` is made on the `main` branch. It first provides a platform for which to build the image that has permissions to read contents and write packages. We're using `ubuntu-latest` in this case. 

The steps laid out are mostly self-explanatory, it will first checkout the repository with the given `secrets.WORKFLOW_PAT` you created in the [prerequisites](#prerequisites). The steps for setting up QEMU and Docker Buildx are [recommened](https://github.com/docker/build-push-action#usage) by the `docker/build-push-action`.

The final two steps are where the magic happens. First logging into the Github Container Registry with a temporary [`GITHUB_TOKEN`](https://docs.github.com/en/actions/security-guides/automatic-token-authentication), then building and pushing the actual image to be packaged.

---

## Running the custom build

When running your newly built image Rancher will need to know to serve the "locally" installed dashboard. You can do this by setting the `CATTLE_UI_DASHBOARD_INDEX` environment variable in your `docker run` command.

For instance:

```sh
docker run -d --name dashboard \
  --restart=unless-stopped \
  --privileged \
  -p 80:80 -p 443:443 \
  -e CATTLE_UI_DASHBOARD_INDEX=https://localhost/dashboard/index.html \
  ghcr.io/<example-repo>:latest
```

---

## Troubleshooting

At the time of writing (February '22), the build time for the Dashboard frontend and Rancher image takes about 8 minutes, so some debugging in place will greatly diminish any frustration while building an action.

The simplest way of adding debugging to your action is by [enabling runner diagnostic logging](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging#enabling-runner-diagnostic-logging). You can do this by adding an environment variable to the beginning of your workflow action `ACTIONS_RUNNER_DEBUG: true`

For instance:

```yml
# /.github/workflows/build-image.yml

...
env:
  ACTIONS_RUNNER_DEBUG: true
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
...
```

This way can be a little verbose but can help narrow down which step is causing you trouble. If you want to see the logs for a specific step you can add an environment variable to your step: `ACTIONS_STEP_DEBUG: true`

For instance:

```yml
# /.github/workflows/build-image.yml

...
- name: Build and push dashboard image
  uses: docker/build-push-action@v2
  env:
    ACTIONS_STEP_DEBUG: true
  with:
    context: ./dashboard
...
```

Some actions have unique debugging features that you can utilize container logs to see what is happening behind the scenes. In our `build-image.yml` example we are using `docker/setup-buildx-action` which has [logs you can access](https://github.com/docker/setup-buildx-action#buildkit-container-logs). 

### Caveats

With `docker/build-push-action` there are [a few caveats](https://github.com/docker/build-push-action/blob/master/TROUBLESHOOTING.md) that could cause confusion. Be sure that your repository name is lowercase!