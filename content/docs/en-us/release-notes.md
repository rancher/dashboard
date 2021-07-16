---
title: 2.6 Release Notes
---
# Enhancements

## Enhanced AKS Lifecycle Management

Full lifecycle management has been brought to AKS (Azure Kubernetes Service) clusters:

-   We now support more configuration options for Rancher managed AKS clusters.
-   We now support more options for configuring private AKS clusters.
-   When provisioning an AKS cluster, you can now use reusable cloud credentials instead of directly using service account credentials when provisioning the cluster.
-   Greater management capabilities are now available for registered AKS clusters. The same configuration options are available for registered AKS clusters as for the AKS clusters created through the Rancher UI.

## Project Network Isolation for Hosted Kubernetes

Project network isolation is now enabled for EKS, AKS and GKE Kubernetes clusters.

It is also enabled for all registered clusters.

## Support for Keycloak using OIDC

The Keycloak OIDC authentication provider is now available in the Rancher UI.

## Windows Support for RKE2

We now support Windows nodes in RKE2 Kubernetes clusters, and we support Calico for Windows nodes in RKE2 clusters.

## CVE Image Scanning

Rancher now proactively scans images for CVE vulnerabilities. Our image scanning tool is public, and we now include the results of our CVE scans in the release assets in CSV format.

## User Level Audit Log Traceability

Without needing access to the Rancher API, UI, or local cluster, a downstream cluster admin can now read the Kubernetes audit logs and know the identity of users in external identity providers who performed actions in the cluster.

## Token Hashing

Token hashing has been added to Rancher as an opt-in feature flag. After a user has opted in, token hashing is permanent and non-reversible.

## Dockershim Support

As of Kubernetes 1.20, Dockershim, the CRI compliant layer between the Kubelet and the Docker daemon will no longer be supported. We now implement the upstream open source community Dockershim announced by Mirantis and Docker to ensure RKE clusters can continue to leverage Docker as their container runtime.

## Disabled Default Backend

The default backend is now disabled by default for ingress-nginx.

## Cluster Provisioning Tech Preview

### RKE2 Cluster Template

We provide an example cluster template for RKE2 that can be used to provision a Kubernetes cluster with the following constraints:

- Multiple node pools for etcd/control plane and workers
- An admin provided cloud credential
- Allow users to enable the authorized cluster endpoint and specify cluster configuration options
- Install Rancher V2 Monitoring
- Assign cluster members

### Disabling Fleet GitOps

Rancher 2.6 requires Fleet as part of the cluster provisioning process, but the ability to turn off the CI portion of Fleet has been added as an opt-in feature flag for those customers who have their own CI and do not wish to use this capability in Fleet.

# UI Updates

## Complete Transition to New UI

Rancher v2.6 completes the transition to a new UI that provides a more cohesive user experience.

The new UI, introduced as the Cluster Explorer in v2.4, has now reached full feature parity with the entire Rancher UI from Rancher v2.3.x.

The Cluster Explorer dashboard first focused on providing a fine-grained view of all resources in a cluster, including custom resources. It also allowed new and improved applications including Logging, Monitoring and Istio to be installed on Rancher managed clusters. In v2.6, the design and layout of the Cluster Explorer expanded to cover all aspects of cluster management, including provisioning of downstream Kubernetes clusters, authentication, role-based access control, cloud credentials, and all global settings.

Before v2.4, Rancher focused on cluster provisioning and cluster access management. Therefore, the UI from those older Rancher versions is called **Cluster Manager.** It appears in the new UI under **Legacy Apps.** 

The legacy Cluster Manager is deprecated and is intended to be used for clusters that have not migrated to use newer versions of applications yet. Note that the applications installed through Cluster Manager will reach EOL in a future Rancher version.

The new and improved UI features that replace the functionality of the Cluster Manager are available under **Cluster Management.**

## Custom Navigation Links

You can create links at the top level and group links together. The links can point to services in the cluster.

## Caveats for Applications in Both Cluster Manager and Cluster Explorer

The following caveats apply to existing clusters that had applications such as Logging and Monitoring installed on them with the legacy Cluster Manager:

- Only one version of the feature may be installed at any given time due to potentially conflicting CRDs.
- Each feature should only be managed by the UI that it was deployed from.
- If you have installed the feature in Cluster Manager, you must uninstall it in Cluster Manager before attempting to install the new version in Cluster Explorer dashboard.

# Other Notes

## Deprecated Features

These applications installed with Cluster Manager will reach EOL in a future Rancher version. We recommend installing the newer versions of these applications through the Cluster Explorer in the Rancher UI.

 |Feature | Justification |
  |---|---|
 |**Cluster Manager - Rancher Monitoring** | Monitoring in Cluster Manager UI has been replaced with a new monitoring chart available in the Apps & Marketplace in Cluster Explorer.  |
|**Cluster Manager - Rancher Alerts and Notifiers**| Alerting and notifiers functionality is now directly integrated with a new monitoring chart available in the Apps & Marketplace in Cluster Explorer.  |
|**Cluster Manager - Rancher Logging** | Functionality replaced with a new logging solution using a new logging chart available in the Apps & Marketplace in Cluster Explorer. |
|**Cluster Manager - MultiCluster Apps**| Deploying to multiple clusters is now recommended to be handled with Rancher Continuous Delivery powered by Fleet available in Cluster Explorer.|
|**Cluster Manager - Kubernetes CIS 1.4 Scanning**|  Kubernetes CIS 1.5+ benchmark scanning is now replaced with a new scan tool deployed with a cis benchmarks chart available in the Apps & Marketplace in Cluster Explorer. |
|**Cluster Manager - Rancher Pipelines**|  Git-based deployment pipelines is now recommend to be handled with  Rancher Continuous Delivery powered by Fleet available in Cluster Explorer. |
|**Cluster Manager - Istio v1.5**| The Istio project has ended support for Istio 1.5 and has recommended all users upgrade. Newer Istio versions are now available as a chart in the Apps & Marketplace in Cluster Explorer. |
|**Cluster Manager - Provision Kubernetes v1.16 Clusters** | We have ended support for Kubernetes v1.16. Cluster Manager no longer provisions new v1.16 clusters. If you already have a v1.16 cluster, it is unaffected. |
