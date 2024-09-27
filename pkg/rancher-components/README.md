# @rancher/components

Rancher Components is a Vue UI library that provides components for developing Rancher Applications and Extensions. Each component follows the [Rancher Design System](https://rancher.github.io/storybook/?path=/story/welcome--page) so that everything you build will integrate tightly with Rancher Dashboard. 
## Project setup
```
yarn
```
### Compiles and minifies for production
```
yarn build:lib
```

### Lints and fixes files
```
yarn lint
```

## Criteria for porting Dashboard components to Rancher Components

Rancher Components aims to provide components crucial for developing Rancher Applications and Extensions. As a result, components should remain simple to import and use by other developers with minimal to no additional configuration. To achieve this vision, early iterations of Rancher Components will not have dependencies on libraries (e.g. vuex) that we might be used to reaching for in daily development. The goal is to keep Rancher Components simple, isolated, and side-effect free.

We've come up with a few guidelines to help developers identify components that might be a good fit before porting:

1. Is this component used in multiple projects? For example, Rancher Dashboard and Rancher Desktop maintained individual implementations of checkbox, radio button, and input components. This duplication of effort was eliminated by including these components in Rancher Components.
2. Is this component a core building block? Core building blocks are components like buttons, inputs, labels, badges, etc.. components used to build larger and more complicated features. We can think of core building blocks akin to atoms and molecules if you subscribe to the concept of [atomic design](https://bradfrost.com/blog/post/atomic-web-design/#atoms).
3. Is this component self-contained? A component should be able to manage its state without relying on Vuex or any API calls.

### Governance

Governance is the most important ingredient to creating a healthy component library that stands the test of time. We must have clear intent and understanding of usage before adding a new component to Rancher Components. Existing Dashboard components might need review before porting so that we can better define clear boundaries between Dashboard and component behavior.

![Rancher Components Docs 2022-11-28 09 19 05 excalidraw](https://user-images.githubusercontent.com/835961/204343084-5b1ad6d3-b9ca-4295-a81f-3f7a02de63f6.png)

## Developing and debugging

### Rancher Dashboard

Rancher Dashboard is a monorepo that houses development for several packages, including Rancher Components. We use [Yarn Workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/) to make developing in a monorepo a little easier.

Running `yarn install` will automatically link inter-package dependencies for each package that has workspaces enabled. The only requirement for linking is that the version is the same in the linked package and the target library. For example, we want to make sure that the `@rancher/components` version matches the dependency for `@rancher/shell` to automatically link

### `@rancher/components package.json`

```
{
  "name": "@rancher/components",
  "repository": "git://github.com:rancher/dashboard.git",
  "license": "Apache-2.0",
  "version": "0.1.0", // The version of @rancher/components that we want to link
  ...
}

```

### `@rancher/shell package.json`

```
{
  "name": "@rancher/shell",
  "version": "0.1.4",
  "description": "Rancher Dashboard Shell",
  "repository": "https://github.com/rancherlabs/dashboard",
  ...
  "dependencies": {
    ...
    "@popperjs/core": "2.4.4",
    "@rancher/components": "0.1.0", // @rancher/components version matches what is in package.json and will automatically link for development
    ...
  } 
}

```

You can build and watch for changes in `@rancher/components` after ensuring that all `@rancher/components` dependencies match the version reflected in `package.json`

```
$ yarn build:lib --watch
```

From this point, you can run Dashboard in another terminal and make changes to either Rancher Shell or Rancher Components. Hot module replacement will function similarly to as if you were developing entirely in a single project.

### Rancher Desktop & other projects

Locally developing and testing component changes in projects outside of Rancher Dashboard requires that you manually link via [npm-link](https://docs.npmjs.com/cli/v8/commands/npm-link) or [yarn-link](https://classic.yarnpkg.com/lang/en/docs/cli/link/). 

First, you will need to run `npm link` or `yarn link` in the `@rancher/components` project

#### yarn

```
$ cd pkg/rancher-components

~/Development/rancher-dashboard/pkg/rancher-components

$ yarn link
yarn link v1.22.19
success Registered "@rancher/components".
info You can now run `yarn link "@rancher/components"` in the projects where you want to use this package and it will be used instead.
Done in 0.04s.
```

#### npm

```
$ cd pkg/rancher-components

~/Development/rancher-dashboard/pkg/rancher-components

$ npm link

up to date, audited 3 packages in 763ms

found 0 vulnerabilities
```

Next, complete the link in any project that has a `@rancher/components` dependency

#### yarn

```
$ cd ~/Development/rancher-desktop

~/Development/rancher-desktop

$ yarn link "@rancher/components"
yarn link v1.22.19
success Using linked package for "@rancher/components".
Done in 0.04s.
```

#### npm

```
$ pushd ~/Development/rancher-desktop

~/Development/rancher-desktop

$ npm link "@rancher/components"

up to date, audited 3502 packages in 17s
...
```

Finally, build and watch `@rancher/components`

```
$ yarn build:lib --watch
```

From this point, you can run your project in another terminal and make changes to Rancher Components. Hot module replacement will function similarly to as if you were developing entirely in a single project.

## Porting and publishing Rancher Components

It's best to handle porting existing Dashboard components into Rancher Components in separate steps to ensure that all packages continue functioning during the porting process.

1. Copy the target component to Rancher Components. Make necessary changes to meet component library acceptance criteria (Bump version in `package.json`)
2. Raise a PR, review, and merge new component
3. Release a new version of Rancher Components
4. Update `@rancher/components` dependency to the latest published version, update imports for the original Dashboard component with the new component, and delete the original Dashboard component.
5. Raise a PR, review, and merge changes
