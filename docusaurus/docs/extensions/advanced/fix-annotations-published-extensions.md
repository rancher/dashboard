# Fixing annotations on published extensions

**Note: This feature is only available in Shell `3.0.0` and upwards!**

As the development of an extension progresses over time, through different versions of Rancher and the Shell package, looking back at those earlier releases some may think why is that extension version available for install in Rancher versions when you know it shouldn't work.

This is due to the fact that when the first releases were done, no-one could foresee if future versions would have breaking changes, therefore [annotations](../extensions-configuration#configurable-annotations) most commonly used like `catalog.cattle.io/rancher-version` or `catalog.cattle.io/kube-version` would either lack an upper limit boundary or just have too low of an upper limit.

Since that extension was already built and served to users, fixing annotations and repackaging an extension my be a pain point that would often get postponed.

With Shell `3.0.0` we have introduced a mechanism that will allow developers to fix annotations on those published extension version that will handle changes on `index.yaml` that will persist over time and also the re-packaging of the `tgz` assets with the correct annotations inside. To leverage this mechanism, developers should follow this procedure:

1) After identifying which extension version you want to fix the annotations for, go to branch of the repository where the Helm chart that serves your extension lives and edit the `Chart.yaml` in `charts/<-YOUR-EXT->/<-EXT-VERSION-TO-FIX->/Chart.yaml` and change the annotations there as desired

2) Once the annotations changes are done, on the root folder of the skeleton app that contains the extension just run the following command:
```js
yarn publish-pkgs -e -g
```

This will update the `index.yaml` of your Helm chart, propagating those annotation changes and also re-package the `tgz` file under `assets`.

3) After the procedure is finished, just create a PR for your repository and merge your changes. The annotations that were changed in those published version should now be according to your needs
