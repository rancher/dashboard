# Using yarn link

You may want to develop your extension with the very latest dashboard code rather than the code published in the `@rancher/shell` npm module.

Suppose we are creating a new UI - it will include the Rancher Shell code via its npm package, so if we needed to make changes to the shell, we'd have to make those changes, publish them as a new version of the package and update our UI to use it.

We can `yarn link` to improve this workflow.

With the Dashboard repository checked out, we can run:

```sh
cd shell
yarn link
```

Then, in our other app's folder, we can:

```sh
yarn link @rancher/shell
```

This will link the package used by the app to the dashboard source code. We can make changes to the shell code in the Rancher Dashboard repository and the separate app will hot-reload.

This allows us to develop a new UI Application and be able to make changes to the Shell - in this use case, we're working against two git repositories, so we need to ensure we commit changes accordingly.

> Note: This feature is most useful for dashboard developers - generally we encourage the use of the published shell module
