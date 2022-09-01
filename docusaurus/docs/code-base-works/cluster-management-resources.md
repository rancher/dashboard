# Cluster Management Resources

This page explains cluster provisioning architecture and implementation details that can give context for future work that needs to be done surrounding the UI for cluster provisioning.

If you are not working on anything related to cluster provisioning, you probably don't need to read the content in this section.

## Background/Context on V2 Cluster Provisioning

One of Rancher's core strengths is its ability to install Kubernetes clusters. That capability was one of Rancher's main features since the product was created, and Rancher specialized in that feature during a time when there was no industry standard for how to provision Kubernetes clusters.

Then in 2020-2021, Cluster API was introduced as a new industry standard for cluster provisioning. Cluster API (CAPI) is an official Kubernetes project that focuses on providing declarative APIs and tooling to simplify provisioning, upgrading, and operating multiple Kubernetes clusters. In other words, it allows us to define  resources on a management Kubernetes cluster that specify the desired state of other Kubernetes clusters.

The power of CAPI is that it allows us to define many types of resources for Kubernetes cluster lifecycle management. That means that in the same way that we already defined resources for the desired state of the applications we want to deploy in Kubernetes, we can now also define YAML resources for infrastructure, such as virtual machines, networks, load balancers, and VPCs, as well as the Kubernetes cluster configuration itself. For more details on the resources involved, see the CAPI API docs: https://cluster-api.sigs.k8s.io/

In the lead-up to Rancher v2.6.0, a great deal of work was done to create V2 cluster provisioning for RKE2 and K3s clusters in such a way that we integrated a new industry standard with our existing cluster provisioning technology that had been continuously improved over the years. In this new version of cluster provisioning, Rancher leverages CAPI resources including Clusters and MachineDeployments to define and manage the desired state of downstream RKE2 and K3s clusters.

## CAPI Integration

There is a key difference between the way that Rancher provisions machines and the way that CAPI users are typically expected to provision machines. Each infrastructure provider that is supported by CAPI creates its own provider project, which serves as the driver between CAPI and the infrastructure provider's APIs. For example, Amazon has this project https://github.com/kubernetes-sigs/cluster-api-provider-aws/tree/v1.4.1 to allow CAPI to manage Kubernetes clusters running in AWS. A typical CAPI user would create their desired manifests for infrastructure based on the documentation from that provider. Rancher takes a different approach, as it does not use those infrastructure providers. Instead, Rancher has created a provider for CAPI to provision clusters using Rancher Machine (https://github.com/rancher/machine). Rancher Machine was originally a Docker project for machine management. Rancher forked that project several years ago and has continued to maintain it since the original project was archived.

There is a long-term plan to replace Rancher machine with the upstream CAPI infrastructure provider's drivers.

The fact that Rancher uses a custom machine driver is one reason why it may be complicated to support node templates for K3s and RKE2.

## Node Templates (V1 provisioning) vs MachineTemplates (V2 provisioning)

In CAPI, the closest equivalent to a node template (the feature that made it possible to reuse machine configs for RKE1 provisioning) is called a MachineTemplate, and those work very differently from node templates:

- Unlike node templates, CAPI MachineTemplates are immutable.
- If a CAPI node pool is updated to use a newer MachineTemplate, it forces the entire node pool to reprovision, which could cause downtime for apps and services.
- CAPI MachineTemplates cannot be reused across multiple clusters because there is an ownership relationship between the Cluster resource and the MachineTemplate that configures machines within it. This means that if multiple Clusters shared the same MachineTemplate, and one Cluster was deleted, the MachineTemplate would be deleted along with it, even if it was in use by another cluster. More details and follow-up on that feature request are here: https://github.com/rancher/dashboard/issues/5981

## Nodes vs Machines

Unlike V1 provisioning, V2 cluster provisioning uses CAPI's MachineDeployment Kubernetes resources to manage node pools.

The Cluster Management app shows management nodes and node pools for RKE1 clusters while showing CAPI Machines and MachineDeployments for K3s and RKE2 clusters. In Cluster Management, on the cluster detail page, the `showMachines` and `showNodes` values are used to determine whether to display CAPI machines or not (https://github.com/rancher/dashboard/blob/master/shell/detail/provisioning.cattle.io.cluster.vue#L224).

In Cluster Explorer, native Kubernetes nodes are displayed for all cluster types. These are Kubernetes nodes as described in the official documentation (https://kubernetes.io/docs/concepts/architecture/nodes/), in the sense that each node defined in the cluster only tells Kubernetes what it needs to know in order to schedule Pods on it. These native Kubernetes nodes are shown in Cluster Explorer under **Cluster > Nodes.**

The nodes in Cluster Explorer are not to be confused with the machines that are shown in the Cluster Management app. In Cluster Management, if you go to a list of machines under **Advanced > Machines** in the side nav, you are not looking at nodes defined in the configuration of a single Kubernetes cluster. You are looking at a CAPI Machine resource that exists in the Rancher server's local cluster, which is also called the management cluster. These Machine resources declaratively specify the desired configuration of machines in the downstream clusters, including many hardware details that the downstream cluster is not aware of.

To summarize, V1 provisioned clusters have nodes, nodePools, and nodeTemplates. These are shown in the Cluster Management detail pages, which show what is configured in the provisioning Cluster resource.

In V2 cluster provisioning, clusters have Machines (https://cluster-api.sigs.k8s.io/user/concepts.html#machine) which are instances of MachineTemplates and have a specific configuration for each infrastructure provider (Digital Ocean, Azure, etc). These infrastructure configuration details are shown in the Cluster Management detail pages for each cluster. In the Rancher UI, the resources used for configuring note templates, such as DigitaloceanConfigs, are hidden because every time they are edited, it forces all node pools using the config to reprovision, which could cause downtime to apps or services on the cluster.

## Cluster Resources

There are three Kubernetes resources in the local Rancher server Kubernetes cluster that are all named Cluster. Since the similar terminology can be somewhat confusing, here is a summary of how to differentiate them.

### Management Clusters - `management.cattle.io.clusters`

Rancher maintains a list of management clusters to maintain a consistent API for tracking all kinds of Kubernetes clusters, including imported clusters. There is one management Cluster resource for every downstream cluster managed by Rancher. It is also the Steve API's representation of Norman/v1 clusters.

In the UI, the management Cluster resource is used in Cluster Explorer. like the provisioning and CAPI cluster resources. It’s used to show info on Kubernetes version, cloud provider, node OSs, and resource usage. No, you can’t edit them, they’re available to users who can work within clusters but can’t necessarily provision clusters. RKE1 and RKE2 clusters both have management clusters; it’s like, a shared interface between all types of clusters so we can have a consistent experience within Cluster Explorer * v1

The `kubectl` command to get the management Cluster resources is:

```
kubectl get clusters.management
```

### Provisioning Clusters - `provisioning.cattle.io.clusters`

The provisioning Cluster resource contains all the details that are configured when a user provisions or edits a V2 RKE2/K3s Kubernetes cluster. It is the only Cluster resource with node pools. The only way to provision K3s/RKE2 clusters in V2 provisioning is to create the provisioning Cluster resource. Rancher then automatically creates the CAPI Cluster resource based on that.

Similar to the management cluster, there is also a one-to-one relationship between each provisioning Cluster resource and each downstream cluster managed by Rancher. Unlike the management cluster, the UI uses provisioning Clusters in the Cluster Management app. The list of clusters is really depicting the provisioning Cluster resources.

The kubectl command to get the management Cluster resources is:

```
kubectl -n fleet-default get clusters.provisioning
```

### CAPI Clusters - `cluster.x-k8s.io.clusters`

This is the upstream CAPI resource used to provision RKE2/K3s clusters. It is automatically created by Rancher and is not meant to be edited by humans. Rancher takes any of a user's edits to the provisioning Cluster resource and will automatically make any necessary changes to the CAPI cluster based on that.

The kubectl command to get CAPI Cluster resources is:

```
kubectl -n fleet-default get clusters.cluster
```
	
### RkeClusters - `rke.cattle.io.rkeclusters`

These are automatically created when provisioning RKE1 clusters and are not meant to be edited by humans.
