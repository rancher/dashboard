# Fixing annotations on published extensions

As the development of an extension progresses over time, through different versions of Rancher and the Shell package, some users may wonder why a specific extension version is available for installation in Rancher versions when it is known that it shouldn't work.

This is due to the fact that when the first releases were done, no-one could foresee if future versions would have breaking changes, therefore [annotations](../extensions-configuration#configurable-annotations) most commonly used like `catalog.cattle.io/rancher-version` or `catalog.cattle.io/kube-version` would either lack an upper limit boundary or just have too low of an upper limit.

Since that extension was already built and served to users, fixing annotations and repackaging an extension my be a pain point that would often get postponed.

Starting with Shell version `3.0.0`, we have introduced a feature that allows developers to update annotations on published extension versions. This mechanism enables changes to persist in the `index.yaml` file over time and ensures that the `tgz` assets are re-packaged with the correct annotations (GitHub only). To leverage this mechanism, developers should follow this procedure:

**1)** Copy over the contents of the root file `package.json` to have access to the yarn command alias `publish-pkgs`. You'll need to create the file on the branch where the Helm chart that serves your extension lives in

**2)** After identifying which extension version you want to fix the annotations for, go to branch of the repository where the Helm chart that serves your extension lives (for the examples we [provide](./../extensions-getting-started.md#creating-a-release) that branch should be `gh-pages`) and edit the `Chart.yaml` in `charts/<-YOUR-EXT->/<-EXT-VERSION-TO-FIX->/Chart.yaml` and change the annotations there as desired

**3)** On the same branch, create on the root a file called `package.json`, with the contents copied from step 1)

**4)** Install node modules by running `yarn install`


**5)** One the root of your branch, just run the following command:
```js
yarn publish-pkgs -e -s <-GITHUB-ORG->/<-GITHUB-REPO->
```

In the case of the [Elemental repo](https://github.com/rancher/elemental-ui), the `GITHUB-ORG` would be `rancher` and `GITHUB-REPO` would be `elemental`

This will update the `index.yaml` of your Helm chart, propagating those annotation changes and also re-package the `tgz` file under `assets`.

**6)** After the procedure is finished, just create a PR for your repository and merge your changes. The annotations that were changed in those published version should now be according to your needs. Careful to only commit the needed changes and not your new `package.json` or the `/node_modules` folder