# Plugins Proof-of-Concept

After checkout:

- Run the script `./scripts/rejig` - this will move most of the code under the `shell` folder and update the appropriate import statements
- Run `yarn install`
- Run `export API=https:{RANCHER_BACKEND}` (where `{RANCHER_BACKEND}` is the address of a running Rancher backend)

The basis of this proof-of-concept is moving the majortiy of the code under the `shell` folder. Additionally, the top-level `nuxt.config.js` is updated
to extend a base version now located within the `shell` folder. This includes updated nuxt and webpack configuration to get everything working with the
moved folders.

Note that this represents the minimum to get things working - the next step would be to move the Rancher and Harvester code out from the `shell` folder into a number
of UI Package folders under the top-level `pkg` folder. This would then reduce the scrope of what's in the `shell` folder to be the core commion UI that we would
want to share across our UIs. So, bear in mind, that ultimately, we wouldn't just be moving all of the code under `shell`.

The rework supports a number of use cases, which we will talk through below.

## Use Case: Rancher Dashboard Development

The goal is to not complicate the development process for Rancher. Although the code has moved around and even once we pull out code into the `pkg` folder, the development
process for Rancher will be the same as it is.

With this repo checked out and the rejig command run (see above), you should be able to use `yarn dev` as before - the UI will build and run just as it does today.

You should be able to make changes to code and the UI should hot-reload in the browser.

The development workflow for Rancher Dashboard would remain unchanged.

## Use Case: Develop a new UI

This use case covers our need to build separate UIs for Harvester, Epino etc - but wanting to leverage the core of the Rancher Dashboard UI.

For this, we would publish the `shell` as an NPM package and leverage this in a new UI project.

To help with this, we created an NPM package to help bootstrap a new UI.

To demonstrate this use case:

In a new console window, install and run [Verdaccio](https://verdaccio.org) (this is a local NPM registry that will allow us to publish and use NPM packages locally without having to push them to the NPM registry):

```
yarn global add verdaccio
verdaccio
```

Now, back in the original console window, run:

```
yarn publish ./shell/creators/app --patch
yarn publish ./shell/creators/pkg --patch
```

These steps will publish the two [creator](https://classic.yarnpkg.com/en/docs/cli/create) packages to the local npm registry. If you open a browser to `http://127.0.0.1:4873` you'll see the two packages there.

Now we'll publish the `shell` package.

```
yarn publish ./shell --patch
```

At this point, we've published 3 NPM packages:

- `@ranch/shell` - the core shell UI that can be incorporated into a new UI to give core funtionality
- `@ranch/create-app` - a simple package that can be used with the `yarn create` command to create a new UI
- `@ranch/create-pkg` - a simple package that can be used with the `yarn create` command to create a new UI Package

Now we can create a new UI, first we need to set the environment variable so that yarn will look for packages in our local registry:

```
export YARN_REGISTRY=http://127.0.0.1:4873
```

Now we can go ahead and create a new UI.

`cd` to a folder not within the checkout and run:

```
yarn create @ranch/app my-app
```

This will create a new folder `my-app` and populate it with the miniumum files needed. You'll note that there is no code here.

You can run the app with:

```
yarn install
yarn dev
```

You should be able to open a browser at `https://127.0.0.1:8005` and you'll get the Rancher Dashboard UI.

This illustrates being able to share the `shell` across UIs - in practice, we would extract the Rancher code from the shell, so instead of getting the Rancher
functionality in this example, you'd get an empty shell applciation with the side menu, UI chrome, avatar menu etc.

You would now add new functionality to this application by adding new UI Packages.

## Use Case: Develop a UI Package

So far, we've show that we can re-use the Rancher Shell to support multiple UIs.

Next up is the ability to add functionality to a UI. We do this through UI packages.

We have a simple `yarn create` helper to do this.

Run:

```
yarn create @ranch/pkg example
```

This will create a new UI Package in the `pkg/example` folder.

Replace the contents of the file `pkg/example/index.js` with:

```
import { importTypes } from '@ranch/auto-import';

// Init the package
export default function(router, store, $extension) {
  // Auto-import model, detail, edit from the folders
  importTypes($extension);

  // Register products
  $extension.addProducts([
    import('./product'),
  ]);
}
```

Next, create a new file `pkg/example/product.js` with this content:

```
export const NAME = 'example';

export function init(store, $extension) {
  const { product } = $extension.DSL(store, NAME);

  product({
    icon:                  'gear',
    inStore:               'management',
    removable:             false,
    showClusterSwitcher:   false,
  });
}
```

You should now be able to run the UI again wtih:

```
yarn dev
```

Open a web browser to https://127.0.0.1:8005 and you'll see a new 'Example' nav item in the top-level slide-in menu.

The example package created here doesn't do much other than add a new product to the UI, which results in the new navigation item,

The developer experience is still the same - you can edit the code in `pkg/example` and the UI will hot-reload to reflect the updates you make.

## Use Case: Dynamically loading a UI Plugin

In the previous use case, the UI package we created was statically built into the UI - this works great for the developer use case where we want to be able to iterate, make changes and see those via hot-reload as we do with Rancher Dashbaord today.

This use case illustrates being able to build a UI plugin as a package and then be able to load that into the UI, dynamically at run-time.

First thing to do is to build the UI package for the example plugin that we created previously. Run:

```
yarn build-pkg example
```

The example plugin will be built and the output placed in `dist-pkg\example`.

