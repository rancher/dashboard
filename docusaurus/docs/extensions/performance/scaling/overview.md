# Introduction

Rancher may connect to clusters that contain a large number of resources. For example an imported cluster may have 10,000 pods.

Similarly the Rancher cluster may be connected to many clusters and be aware of all their nodes 20,000 nodes.

> The following applies to components and processes that result in requests to the internal Rancher "Steve" API
> - `/v1/<resource>` 
> - `/k8s/clusters/<cluster id>/v1/...`
>
> Those resulting in requests to the internal Rancher "Norman" API or directly to the Kube API do not require updating.
> - `/v3/<resource>`
> - `/apis/...` 
> - `/k8s/clusters/<cluster id>/apis/...`

## Approach

### Legacy 
Before `v2.12.0` the pattern to access and monitor resources was to 
1. Make a http request to fetch all resources of that type
1. Receive updates to all resources via WebSocket
   - A socket message is received once for any change to any resource of that type.
   
However this does not scale when the resource count increases. 
- Takes a long time to fetch all resources
- Increases memory footprint, impacting browser performance
- Lots of churn when resources change, there could be 100s of web socket messages a second


### New
From `v2.12.0` a new process is targeted to be released which will improve performance at scale.

- Fetch only the resources required by the current view
  - Lists will fetch a single page's worth of resources via server-side pagination, 
  - Outside of lists resources are filtered server-side to only fetch the required resources 
- Watch the resource type and update when required 
  - A resource type is still watched, however the UI is notified once when any have changed
  - The UI will then re-fetched that resource type with the original filters
  - This replaces 100s web socket updates per second

This process has been enabled by default and applied to almost all resources used by the Cluster Explorer (pages shown after clicking on a cluster in the side bar). Other areas and resources will be updated in v2.13.0.

For general information regarding v2.12.0 and this feature please see the [v2.12.0 Rancher Release Notes](https://github.com/rancher/rancher/releases/tag/v2.12.0)

After v2.13.0 the legacy approach may become deprecated, but until then it is possible to disable the new approach entirely. Therefore both enabled and disabled approaches need to be supported. The changes in v2.12.0 and instructions on following pages should assist with this.

## Updates
As an extension developer you will need to update your extension to make use of new generic components and actions that utilize the new approach. Run through the following pages to do so. For convenience there is a `checklist` at the end of each section.
