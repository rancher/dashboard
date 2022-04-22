---
title: What's New in 2.6
---

## New in 2.6.4

### Kubernetes 1.22 Support

- Kubernetes 1.22 is now available as a supported Kubernetes version option when provisioning RKE1 clusters as well as upgrading imported RKE2/k3s clusters.

### Experimental - Kubernetes 1.23 Support

- Kubernetes 1.23 has been introduced as an available Kubernetes version option when provisioning RKE1 clusters as well as upgrading imported RKE2/k3s clusters. This has been noted as experimental due to RKE1 clusters not having upstream vSphere CPI/CSI charts released as well as Windows RKE1 clusters not having dual-stack IPv4/IPv6 support.


## New in 2.6.3

### Harvester Integration

- Harvester's integration with Rancher and RKE1 provisioning is now GA. Users can provision Kubernetes clusters with RKE1 and manage multiple Harvester HCI clusters from a single Rancher instance. 
- RKE2 provisioning on Harvester is still Tech Preview.

### Experimental - Kubernetes 1.22 support

- Kubernetes 1.22 has been introduced as an available Kubernetes option when provisioning clusters as well as upgrading imported RKE2/k3s clusters.

### Expanded support for Authorized Cluster Endpoint (ACE)

- Cluster admins can now configure ACE on imported RKE2/K3s clusters.

### Workload UX enhancements

- Added dashboards for workload metrics into the Rancher UI. 
- Added ability to pause orchestration, update the scale, and visualize the deployment health from within the main list views.

Read the full [release notes](https://github.com/rancher/rancher/releases/tag/v2.6.3) for more details.

## New in 2.6.0

### Redesigned Rancher User Experience

There is a new refreshed look and feel in the UI making it easy to use for beginner and advanced Kubernetes users:

- Cluster explorer navigation is updated so that users now see a collapsed subset of the most used Kubernetes resources expressed in simple terms. Any Kubernetes resource can be managed through the explorer and quickly found through the resource search functionality. Users can now manage their projects. Cluster tools like monitoring and logging are aggregated under an easy-to-discover **Cluster Tools** menu. The cluster dashboard now includes live metrics when monitoring is enabled.
- Global navigation is redesigned to make it easier for users and admins to quickly switch between clusters and top-level apps.
-  Cluster management lists all of a user's clusters and has been enhanced with its own left-hand navigation menu to bring all cluster lifecycle tools into a single place.

### Enhanced Branding and Customization Options

- Admins can now manage the logo and color in Rancher through a single brand management page.
- Users can add links to their own applications in the cluster explorer navigation.

### Enhanced AKS Lifecycle Management
- Provisioning AKS clusters is updated to support private AKS endpoints, multiple node pools, autoscaling and leverage Rancher cloud credentials for authentication.
- Existing AKS clusters can be registered, which enables the ability to manage Kubernetes versions and configuration settings.

### Enhanced GKE Lifecycle Management
- Provisioning GKE clusters is updated to support shared VPCs, multiple node pools, autoscaling, and network tags.
- Existing GKE clusters can be registered, which enables the ability to manage Kubernetes versions and configuration settings.
- Rancher’s project network isolation can be enabled for GKE clusters that were provisioned through Rancher or registered.

### Tech Preview - RKE2 Cluster Provisioning

- A new provisioning framework built on top of Cluster API is introduced to support the provisioning of RKE2 clusters.
- RKE2 clusters can be provisioned to bring up VMs through Rancher in various cloud infrastructure providers, such as AWS, Azure, vSphere, Linode and DigitalOcean.
- RKE2 clusters can also be provisioned on existing virtual or bare metal servers.

### Tech Preview - RKE2 Windows Worker Nodes Support

- Windows worker nodes can be added to any RKE2 custom cluster that is using the default Calico CNI.

### Tech Preview - Cluster Templates

- Cluster templates provide the ability to control which parameters can be customized for provisioning clusters.

Examples of what a cluster can define are:
-  Node pools for etcd, control plane and workers.
-  Cloud credentials for provisioning nodes.

### Keycloak using OIDC

- Keycloak can now be authenticated using OIDC.

### Security Enhancements

- Admins can now trace users by username and identity provider (IdP) in the Rancher and Kubernetes audit logs.
- Admins can enable one-way hashing of Rancher API tokens.

Read the full [release notes](https://github.com/rancher/rancher/releases/tag/v2.6.0) for more details.
