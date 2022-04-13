# Plugins

During the transition to the new folder structured in 2.6.5 required by the plugin work ...
- Run the script `./scripts/rejig` to move folders to their new location in the `shell` folder and update the appropriate import statements
  Use this to convert older PRs to the new format
- Run the script `./scripts/rejig -d` to move folders to their old location and update imports again
  Use this to convert newer branches to the old format (possibly useful for branches) 
  > IMPORTANT - This script contains a `git reset --hard`

## Step 1
The basis of this step 1 is to move the majority of the code under the `shell` folder. Additionally, the top-level `nuxt.config.js` is updated
to extend a base version now located within the `shell` folder. This includes updated nuxt and webpack configuration to get everything working with the
moved folders.

Note that this represents the minimum to get things working - the next step would be to move the Rancher and Harvester code out from the `shell` folder into a number
of UI Package folders under the top-level `pkg` folder. This would then reduce the scope of what's in the `shell` folder to be the core common UI that we would
want to share across our UIs. So, bear in mind, that ultimately, we wouldn't just be moving all of the code under `shell`.

The rework supports a number of use cases, which we will talk through below.

## Use Case: Rancher Dashboard Development

The goal is to not complicate the development process for Rancher. Although the code has moved around and even once we pull out code into the `pkg` folder, the development
process for Rancher will be the same as it is.

With this repo checked out and the rejig command run (see above), you should be able to use `yarn dev` as before - the UI will build and run just as it does today.

You should be able to make changes to code and the UI should hot-reload in the browser.

The development workflow for Rancher Dashboard would remain unchanged.

## Use Case: Develop a new UI

This use case covers our need to build separate UIs for Harvester, Epinio etc - but wanting to leverage the core of the Rancher Dashboard UI.

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
npm adduser --registry http://localhost:4873  (just add a user with username/password: admin/admin)
yarn publish ./shell/creators/app --patch
yarn publish ./shell/creators/pkg --patch
```

These steps will publish the two [creator](https://classic.yarnpkg.com/en/docs/cli/create) packages to the local npm registry. If you open a browser to `http://127.0.0.1:4873` you'll see the two packages there.

Now we'll publish the `shell` package.

```
yarn publish ./shell --patch
```

At this point, we've published 3 NPM packages:

- `@rancher/shell` - the core shell UI that can be incorporated into a new UI to give core funtionality
- `@rancher/create-app` - a simple package that can be used with the `yarn create` command to create a new UI
- `@rancher/create-pkg` - a simple package that can be used with the `yarn create` command to create a new UI Package

Now we can create a new UI. First we need to set the environment variable so that yarn will look for packages in our local registry:

```
export YARN_REGISTRY=http://127.0.0.1:4873
```

Now we can go ahead and create a new UI.

`cd` to a folder not within the checkout and run:

```
yarn create @rancher/app my-app
cd my-app
```

This will create a new folder `my-app` and populate it with the miniumum files needed.

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
yarn create @rancher/pkg testplugin
```

This will create a new UI Package in the `pkg/testplugin` folder.

Replace the contents of the file `pkg/testplugin/index.js` with:

```
import { importTypes } from '@rancher/auto-import';

// Init the package
export default function($plugin) {
  // Auto-import model, detail, edit from the folders
  importTypes($plugin);

  $plugin.addProduct(require('./product'));
}

```

Next, create a new file `pkg/testplugin/product.js` with this content:

```
export function init($plugin, pluginName) {
  const { product } = $plugin.DSL(pluginName);

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

The `testplugin` package created here doesn't do much other than add a new product to the UI, which results in the new navigation item.

The developer experience is still the same - you can edit the code in `pkg/testplugin` and the UI will hot-reload to reflect the updates you make.

## Use Case: Dynamically loading a UI Plugin

In the previous use case, the UI package we created was statically built into the UI - this works great for the developer use case where we want to be able to iterate, make changes and see those via hot-reload as we do with Rancher Dashbaord today.

This use case illustrates being able to build a UI plugin as a package and then be able to load that into the UI, dynamically at run-time.

First thing to do is to build the UI package for the `testplugin` plugin that we created previously. Run:

```
yarn build-pkg testplugin
```

The `testplugin` plugin will be built and the output placed in `dist-pkg\testplugin`.

Next, edit the `nuxt.config.js` file in the root folder and replace it with this:

```
import config from '@rancher/shell/nuxt.config';

export default config(__dirname, {
  excludes:   ['testplugin'],
  autoImport: []
});

```

What we have done here is add the `testplugin` plugin to the `excludes` configuration - this means that when we build and run the UI, we won't include the `testplugin` plugin.

Run the UI with:

```
yarn dev
```

Open a web browser to `https://127.0.0.1:8005` and you'll see that the Example nav item is not present - since the plugin was not loaded.

Bring in the slide-in menu (click on the hamburger menu in the top-left) and click on 'Plugins'.

In the top input box, enter `testplugin` as the Plugin name and click 'Load Plugin' - you should see a notification telling you the plugin was loaded and if you bring in the side menu again, you should see the Example nav item there now.

This illustrates dynamically loading a Plugin. Note that when we started the UI, it serves up any plugins in the `dist-pkg` folder under the `/pkg` route of the app - so when we entered the name `testplugin` as the plugin, the UI loaded the plugin from:

```
https://127.0.0.1:8005/pkg/testplugin/testplugin.umd.min.js
```

If you copy and paste this URL into a browser, you'll see the Javascript for the plugin.

To really convince yourself that the plugin is being dynamically loaded, reload the app in the browser window (the `testplugin` plugin will no longer be loaded). Go to Plugins and in the `Plugin URL` enter the URL above and click `Load Plugin` - the plugin will load again - if you look in the browser developer tools under the network tab, you'll see the plugin being dynamically loaded.

If you want to, you can run:

```
yarn serve-pkgs
```

This will start a web server on port `4500` that is serving up the plugins in the `dist-pkg` folder - it shows the URLs to use for each of the available packages. You can then load these dynamically into any UI that you have running.

## Use Case: Publish a package to NPM

Building on from the previous use case, we can publish a plugin to NPM.

From the top-level folder:

```
yarn build-pkg testplugin
cd dist-pkg/testplugin
yarn publish --patch
```

Open a web browser and view the Verdaccio UI at http://127.0.0.1:4873 - you'll see we've published our plugin as a package to the registry.

In a new folder, run:

```
yarn create @rancher/app test2
cd test2
yarn install
```

This will give us a new UI - we can run `yarn dev` and see the UI in the browser - with no plugins.

Now we can add our UI package that we published to the local registry with:

```
yarn add testplugin
```

Now when we run the app with `yarn dev` and browse to https://127.0.0.1:8005 you'll see that our `testplugin` plugin ahas been included in the UI.

This supports the use case where we may be developing a UI Package that relies on another UI package - so we can create a skeleton app, add the dependencies we need via NPM and then develop our own plugin in the repository - so the only code we have is the code for out plugin, but we are able to test and run it in a UI locally with the other plugins that it needs.

## Use Case: Using Yarn link

Suppose we are creating a new UI - it will include the Rancher Shell code via its npm package, so if we needed to make changes to the shell, we'd have to make those changes, publish them as a new version of the package and update our UI to use it.

We can `yarn link` to improve this workflow.

With the Dashboard repository checked out, we can:

```
cd shell
yarn link
```

Then, in our other app's folder, we can:

```
yarn link @rancher/shell
```

This link the package used by the app to the dashboard source code. We can make changes to the shell code in the Rancher Dashboard repository and the separate app will hot-reload.

This allows us to develop a new UI Application and be able to make changes to the Shell - in this use case, we're working against two git repositories, so we need to ensure we commit chanages accordingly.
