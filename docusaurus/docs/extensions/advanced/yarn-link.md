# Using yarn link

You may want to develop your extension with the very latest dashboard code rather than the code published in the `@rancher/shell` npm module.

Suppose we are creating a new UI - it will include the Rancher Shell code via its npm package, so if we needed to make changes to the shell, we'd have to make those changes, publish them as a new version of the package and update our UI to use it.

We can `yarn link` to improve this workflow.

The published `@rancher/shell` package includes generated type definitions that a checkout of the Dashboard repository does not. Generate them first, from the root of the Dashboard repository:

```sh
./shell/scripts/typegen.sh
```

Then, in our other app's folder, link to the `shell` folder of the Dashboard repository:

```sh
yarn link <path-to-dashboard>/shell
```

This will link the package used by the app to the dashboard source code. We can make changes to the shell code in the Rancher Dashboard repository and the separate app will hot-reload.

`yarn link` records the link as a `portal:` entry in the `resolutions` field of the app's `package.json` and updates `yarn.lock`. Do not commit these changes. To remove the link, run:

```sh
yarn unlink <path-to-dashboard>/shell
```

This allows us to develop a new UI Application and be able to make changes to the Shell - in this use case, we're working against two git repositories, so we need to ensure we commit changes accordingly.

> Note: This feature is most useful for dashboard developers - generally we encourage the use of the published shell module
