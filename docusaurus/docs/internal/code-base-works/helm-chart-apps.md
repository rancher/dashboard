# Helm Chart Apps

When you install or upgrade Helm chart apps through Rancher,
the UI passes several values to the Helm CLI command
that installs or upgrades the app.

## Injected Global Values

The Rancher UI injects the following global values
into the Helm chart values of apps installed through Rancher.
It adds them under `values.global.cattle.`

| YAML Directive                | Source                                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `cattle.clusterId`            | The management cluster ID                                                                                       |
| `cattle.clusterName`          | The management cluster name                                                                                     |
| `systemDefaultRegistry`       | The default registry, taken from the settings                                                                   |
| `cattle.url`                  | The Rancher server URL, taken from the settings                                                                 |
| `cattle.rkePathPrefix`        | The prefix path defined in the management cluster at `spec.rancherKubernetesEngineConfig.prefixPath`            |
| `cattle.rkeWindowsPathPrefix` | The Windows prefix path defined in the management cluster at `spec.rancherKubernetesEngineConfig.winPrefixPath` |
| `cattle.windows`              | Included in global values if `workerOSs` on the management cluster contains Windows                             |
| `cattle.systemProjectId`      | Taken from the ID of the project named System                                                                   |

If there are two charts associated with an app, such as `rancher-monitoring` and `rancher-monitoring-crd`, Rancher injects the global values into the values of both charts.


## Injecting User Values

When you select a version, a new chart is loaded.
Rancher anticipates that you probably want to port all of your
previously customized, non-default values from the old chart
version to the new chart version, so it applies the previous
chart's customization (the diff between the current and default
values of the existing chart) to the new chart values before
you see the values form on the next page in the workflow.

We assume that any difference between the values in
two different Helm chart versions is a "user value," or
a user-selected customization.

When Rancher makes the async call to install or upgrade
an app, all of the data under `values` in the chart data
(except for the global values) is created by getting the
difference between the chart's standard `values.yaml` and
the user's customized `values.yaml`. The actual diff function
used is in `shell/utils/object.js`. For any values that
in the standard YAML but not the user's YAML, null values
are added to the result.

The standard YAML comes from `versionInfo`. The `versionInfo`
originates from the store:

```js
this.versionInfo = await this.$store.dispatch('catalog/getVersionInfo', {
    repoType:      this.query.repoType,
    repoName:      this.query.repoName,
    chartName:     this.query.chartName,
    versionName: this.query.versionName
});
```

The store gets the information from the backed by following
a link in the relevant GitHub repo and providing the chart
name and version:

```js
info = await repo.followLink('info', {
    url: addParams(repo.links.info, {
        chartName,
        version: versionName
    })
});
```

## Example Output

Example output that the UI sends in the async call when
installing the monitoring app:

```json
{
    "charts": [
        {
            "chartName": "rancher-monitoring-crd",
            "version": "100.1.3+up19.0.3",
            "releaseName": "rancher-monitoring-crd",
            "projectId": "c-m-hhpg69fv/p-j4p76",
            "values": {
                "global": {
                    "cattle": {
                        "clusterId": "c-m-hhpg69fv",
                        "clusterName": "c4",
                        "systemDefaultRegistry": "",
                        "systemProjectId": "p-j4p76",
                        "url": "https://143.198.67.178",
                        "rkePathPrefix": "",
                        "rkeWindowsPathPrefix": ""
                    },
                    "systemDefaultRegistry": ""
                }
            },
            "annotations": {
                "catalog.cattle.io/ui-source-repo-type": "cluster",
                "catalog.cattle.io/ui-source-repo": "rancher-charts"
            }
        },
        {
            "chartName": "rancher-monitoring",
            "version": "100.1.3+up19.0.3",
            "releaseName": "rancher-monitoring",
            "annotations": {
                "catalog.cattle.io/ui-source-repo-type": "cluster",
                "catalog.cattle.io/ui-source-repo": "rancher-charts"
            },
            "values": {
                "prometheus": {
                    "prometheusSpec": {
                        "evaluationInterval": "1m",
                        "retentionSize": "50GiB",
                        "scrapeInterval": "1m"
                    }
                },
                "rke2ControllerManager": {
                    "enabled": true
                },
                "rke2Etcd": {
                    "enabled": true
                },
                "rke2IngressNginx": {
                    "enabled": true
                },
                "rke2Proxy": {
                    "enabled": true
                },
                "rke2Scheduler": {
                    "enabled": true
                },
                "global": {
                    "cattle": {
                        "clusterId": "c-m-hhpg69fv",
                        "clusterName": "c4",
                        "systemDefaultRegistry": "",
                        "systemProjectId": "p-j4p76",
                        "url": "https://143.198.67.178",
                        "rkePathPrefix": "",
                        "rkeWindowsPathPrefix": ""
                    },
                    "systemDefaultRegistry": ""
                }
            }
        }
    ],
    "noHooks": false,
    "timeout": "600s",
    "wait": true,
    "namespace": "cattle-monitoring-system",
    "projectId": "c-m-hhpg69fv/p-j4p76",
    "disableOpenAPIValidation": false,
    "skipCRDs": false
}
```