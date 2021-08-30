---
title: 2.6 Release Notes
---
> It is important to review the [upgrade notes](#installupgrade-notes) before upgrading to any Rancher version.

# Features and Enhancements

### Redesigned Rancher User Experience

2.6 UX introduces a new navigation look and feel:

- **New home landing page**: The default UI landing page provides a quick overview of the Rancher installation. Users can see what is new in the current release, find support, quickly jump into a cluster, or provision their first cluster. See [#2511](https://github.com/rancher/dashboard/issues/2511).
- **New app navigation**: The primary navigation menu has been redesigned and simplified to make it easier for users and admins to switch between top-level apps. See [#2499](https://github.com/rancher/dashboard/issues/2499).
- **New global navigation**: The page listing all of a user's clusters has been enhanced with a new left-hand navigation menu to manage clusters, credentials, pod security policy templates and node drivers from a single place. See [#2849](https://github.com/rancher/dashboard/issues/2849).
- **New individual cluster navigation**: The Rancher UI view for individual clusters has been enhanced for both new users and advanced users. Users now see a collapsed subset of the most-used Kubernetes resources. Any Kubernetes resources can quickly be found through the search functionality on the cluster. Cluster admins can now administer projects from the cluster detail view. Cluster tools like logging and monitoring are now aggregated under a new easy-to-discover **Cluster Tools.** The cluster detail page is now enhanced with cluster and pod live metrics dashboards when Monitoring is deployed through the Cluster Tools. See [#2578](https://github.com/rancher/dashboard/issues/2578)

Because the Cluster Manager and Cluster Explorer from Rancher v2.5 have been consolidated into a unified experience, those terms have been replaced in these release notes with "the global view" and "the cluster detail page."

### Enhanced Branding and Customization Options

A new brand management page has been added to allow customizations to the Rancher UI in a single place:

- Admins can now customize the logo image, display name, and primary color displayed throughout the Rancher UI.
- Admins can specify a link to direct users to a support page.
- Admins can disable displaying Rancher community support links.
- Cluster navigation customizations:
  - Users can now add top-level links in the left navigation of the cluster detail page.
  - Users can create groups of links that point to external and services within the cluster.

For details, see the [documentation](https://rancher.com/docs/rancher/v2.6/en/admin-settings/branding/) and [#2835](https://github.com/rancher/dashboard/issues/2835).

### Enhancements for Hosted Kubernetes Clusters

- **AKS provisioning enhancements:** AKS provisioning has been enhanced to support the full lifecycle management of the cluster. Users can now provision private AKS endpoints, multiple node pools, and leverage Rancher cloud credentials for authentication. Existing AKS clusters provisioned with other tools like the Azure Portal can now be registered into Rancher to allow management of Kubernetes upgrades and configuration going forward. Rancher will warn cluster owners if RBAC is turned off in an AKS cluster, ensuring awareness that key security capabilities are turned off. See the [documentation](https://rancher.com/docs/rancher/v2.6/en/cluster-admin/editing-clusters/aks-config-reference/#changes-in-rancher-v2-6).
  - **Note for AKS Clusters with RBAC Disabled:** It is possible to create an AKS cluster in the Azure portal that has RBAC disabled. Since Rancher relies heavily on RBAC, a warning message is displayed when registering and viewing an AKS cluster in Rancher that has RBAC disabled. See [#27670](https://github.com/rancher/rancher/issues/27670).
- **GKE provisioning enhancements:**
  - **Abiltiy to support network tags:** When provisioning node pools in GKE clusters, users can add [network tags](https://cloud.google.com/vpc/docs/add-remove-network-tags) to make firewall rules and routes between subnets.
  - **Ability to support Project Network Isolation for registered GKE clusters**: Admins and project owners can now leverage project network isolation to restrict network access between projects on imported/registered GKE clusters.
- **Deploying on hardened clusters:** Support has been added for deploying and registering AKS, EKS, and GKE clusters on hardened clusters. See [#29066](https://github.com/rancher/rancher/issues/29066).

### Security Enhancements

- **Rancher server container based on SLE BCI image**: The base image for Rancher server and agent have been moved to SLE BCI. See [#33127](https://github.com/rancher/rancher/issues/33127).
- **Rancher API token hashing**: A new opt-in feature flag has been added to enable one-way hashing of Rancher tokens. Enabling this flag is one-way and non-reversible and should be vetted in dev/test environments before enabling in production. See the [documentation](https://rancher.com/docs/rancher/v2.6/en/api/api-tokens) and [#31214](https://github.com/rancher/rancher/issues/31214).
- **Username and Identity Provider (IDP) name added to Rancher and Kubernetes audit logs**: Admins can now view Rancher usernames and IDP (e.g., Active Directory and Github) usernames in the Kubernetes audit logs and the Rancher API audit logs, when interacting with the cluster through Rancher UI. Downstream cluster admins no longer have to map the u-********* name back to a user in the Rancher local cluster manually. This allows admins to track a user's activity by using the IDP username throughout the system including login and failed login attempts. See the [documentation](PLACEHOLDER) and [#31166](https://github.com/rancher/rancher/issues/31166).
- **Randomly generated bootstrap password**: A random bootstrap password is always generated for the user when Rancher is started for the first time, unless the users sets `bootstrapPassword` in the Helm chart values or `CATTLE_BOOTSTRAP_PASSWORD` on the Docker container. See the [documentation](https://rancher.com/docs/rancher/v2.6/en/installation/resources/bootstrap-password) and [#121](https://github.com/rancher/rancher/pull/32749).

### Tech Preview - RKE2 Cluster Provisioning

Rancher 2.6 introduces provisioning for RKE2 clusters directly from the Rancher UI/API. RKE2 provisioning is built on top of a new provisioning framework that leverages the upstream Cluster API project. With this new provisioning framework, users will be able to provision RKE2 clusters on Digital Ocean, AWS EC2, Azure, and vSphere. Users will be able to fully configure their RKE2 clusters within the provisioning framework. Users will be able to choose CNI options Calico, Cilium, and Multus in addition Canal. Users will also be able to provision custom RKE2 clusters with a single command on pre-provisioned VMs or bare metal nodes.

### Tech Preview - RKE2 Windows Cluster Provisioning

- **Windows Containers on RKE2:** Added support for Windows Containers to RKE2 powered by containerd. See [#4](https://github.com/rancher/windows/issues/4).
- **Provisioning Windows Containers in Rancher UI/API:** Added provisioning of Windows RKE2 custom clusters directly from the Rancher UI/API. See [#4](https://github.com/rancher/windows/issues/4).
- **Windows RKE2 Agents**: Added RKE2 Agent functionality for standalone Windows RKE2 custom clusters. See [#1166](https://github.com/rancher/rke2/issues/1166).
- **Calico for Windows Containers:** Implemented Calico CNI for Windows RKE2 custom clusters. Windows Support for RKE2 Custom Clusters requires choosing Calico as the CNI. See [#49](https://github.com/rancher/windows/issues/49) and [#1529](https://github.com/rancher/rke2/issues/1529).
- **V2 Cluster Provisioning for Windows Clusters:** Users can now provision Windows RKE2 custom clusters with a single command on pre-provisioned VMs or bare metal nodes. See [#1240](https://github.com/rancher/rke2/issues/1240).
- **K3s Upstream Changes:** Upstreamed required changes to K3s to enable Windows Agent Support in RKE2. See [#3418](https://github.com/k3s-io/k3s/issues/3418) and [#3419](https://github.com/k3s-io/k3s/issues/3419).
- **Supported Windows Server Hosts:** Support is planned for RKE2 Agent nodes running on LTSC versions of Windows Server. SAC releases of Windows Server (2004 and 20H2) are included in the technical preview. See [#1240](https://github.com/rancher/rke2/issues/1240).
- **Known Issues:**
  - Airgap support is not currently supported for Windows Containers on Rancher on RKE2.
  - Setting an external IP is currently not an option for Windows Containers.
- **Documentation for RKE2 Windows Cluster Provisioning:**
  - [Windows RKE2 Quickstart Guide](https://docs.rke2.io/install/quickstart/#windows-agent-worker-node-installation)
  - [Experimental RKE2 Windows Airgap Support](https://docs.rke2.io/install/windows_airgap/)
  - [Windows Agent Configuration Reference](https://docs.rke2.io/install/install_options/windows_agent_config/). See [#1276](https://github.com/rancher/rke2/issues/1276).
  - [Windows Uninstall Script for RKE2](https://docs.rke2.io/install/windows_uninstall/). See [#1487](https://github.com/rancher/rke2/issues/1487).

### Tech Preview - Cluster Templates and Example RKE2 Cluster Template

Cluster templates allow an admin to define a base cluster configuration for users to consume when provisioning clusters. Cluster templates in the new provisioning framework are built as Helm charts and added to Rancher through the catalog.

Unlike RKE templates, which are for enforcing RKE configuration after the cluster is created, cluster templates include more configuration options and do not affect the cluster after it is initially provisioned. Cluster templates can define node pools, cloud credentials, cluster members, and installation of Rancher tools like monitoring. We provide an example cluster template for RKE2 that can be used to provision a Kubernetes cluster with the following constraints:
  - Multiple node pools for etcd/control plane and workers
  - An admin provided cloud credential
  - Allow users to enable the authorized cluster endpoint and specify cluster configuration options
  - Install Rancher V2 Monitoring
  - Assign cluster members

We provide an example cluster template for an RKE2 cluster [here.](https://github.com/rancher/cluster-template-examples#rke2-cluster-template) To customize the template, you will need to fork the repository, add the Helm chart to a Rancher catalog, and install the template through the catalog. Rancher then provisions the Kubernetes cluster, and the cluster can be managed through Rancher in the same way as any other Rancher-launched Kubernetes cluster.

See the [documentation](https://rancher.com/docs/rancher/v2.6/en/admin-settings/cluster-templates) and [#30099](https://github.com/rancher/rancher/issues/30099).

More cluster template examples will be added to the [cluster template repository](https://github.com/rancher/cluster-template-examples) in the future.

## Enhancements for RKE Clusters

- **Added Kubernetes 1.21**: We've added support for Kubernetes 1.21 clusters for RKE.
- **Added RKE External Dockershim Support**: As of Kubernetes 1.20, the in-tree Dockershim was deprecated and is scheduled for removal in Kubernetes 1.22. The Dockershim is the CRI compliant layer between the Kubelet and the Docker daemon. RKE clusters now support the external Dockershim to continue leveraging Docker as the CRI runtime. We now implement the upstream open source community Dockershim announced by Mirantis and Docker to ensure RKE clusters can continue to leverage Docker. See the [documentation](https://rancher.com/docs/rancher/v2.6/en/installation/requirements/) and [#31943](https://github.com/rancher/rancher/issues/31943).
- **NGINX Ingress default backend no longer a separate deployment**: The default backend for the NGINX Ingress controller is now self-contained. Previously, the default backend was deployed as a pod and service. See [#30356](https://github.com/rancher/rancher/issues/30356).
- **Windows RKE Prefix Path Support:** Add support for Windows RKE prefix path with the ability to parse multiple styles of paths and separators. See [#32268](https://github.com/rancher/rancher/issues/32268).
- **Dual-stack Support:** Starting with Kubernetes v1.21, it is possible to configure dual-stack clusters in combination with the Calico network provider. See [#33107](https://github.com/rancher/rancher/issues/33107).
- **hostPort for NGINX Ingress:** The NGINX Ingress Controller version deployed with Kubernetes v1.21 and higher will be configured using hostPort instead of using hostNetwork. The NGINX Ingress Controller runs a validating admission webhook server which would be exposed externally when using hostNetwork. To avoid exposing it externally, the NGINX Ingress Controller runs in hostPort for port 80 and port 443, and the validating admission webhook server uses a ClusterIP which is only reachable from inside the cluster. See [#33792](https://github.com/rancher/rancher/issues/33792).
- **ECR repository private registry configuration support**: Added support to configure ECR repository as a private registry. See [#28693](https://github.com/rancher/rancher/issues/28693).

### Rancher Logging Enhancements

- Add support for configuring `fluentd` and `fluent-bit` buffer sizes. See [#28401](https://github.com/rancher/rancher/issues/28401).
- Add support for more `fluentd` options: `bufferStorageVolume`, `nodeSelector`, `tolerations` (specific to `fluentd`), and `replicas`. See [#31807](https://github.com/rancher/rancher/issues/31807).
- Add support for Windows RKE prefix path with the ability to handle multiple kinds of pathing styles and separators. See [#32268](https://github.com/rancher/rancher/issues/32268).
- K3s logs are now aggregated through journald and are more refined. See [#32993](https://github.com/rancher/rancher/issues/32993).
- The number of fluentd replicas is now configurable. See [#33373](https://github.com/rancher/rancher/issues/33373).
- Upgraded the Banzai logging operator. See [#32748](https://github.com/rancher/rancher/issues/32748).
- Add timestamps to RKE2 control plane logs. See [#32917](https://github.com/rancher/rancher/issues/32917).

### Continuous Delivery Enhancements
- **Extended support for Fleet values:** Add `valuesFrom` feature for `ConfigMaps` and `Secrets` to provide `values.yaml` for Fleet. See [#384](https://github.com/rancher/fleet/issues/384).
- **Ability to support bundle dependencies:** Support bundle dependency. See [#392](https://github.com/rancher/fleet/issues/392).
- **Updated namespaces to avoid potential Fleet naming conflicts:** Move Fleet to `cattle-fleet-system` from `fleet-system` to avoid collisions with other apps named `fleet`. See [#395](https://github.com/rancher/fleet/issues/395).
- **New Fleet GitOps feature flag:** Rancher v2.6's new cluster provisioning system leverages Fleet's bundle deployment capabilities in order to manage clusters at scale. Therefore, in Rancher v2.6, Fleet can no longer be disabled. If Fleet was disabled in Rancher v2.5.x, it will become enabled if Rancher is upgraded to v2.6.x. A new feature flag was added to Rancher to disable the GitOps CD portion for end users within Rancher. See the [documentation](https://rancher.com/docs/rancher/v2.6/en/installation/resources/feature-flags/continuous-delivery), [#32688](https://github.com/rancher/rancher/issues/32688) and [#32808](https://github.com/rancher/rancher/issues/32808).
- **Miscellaneous fixes for Provisioning V2:** various edge cases were mitigated and performance inconsistencies were fixed in preparation for Provisioning V2.

### Other Enhancements

- **Support for Keycloak with OIDC**: A new Keycloak auth provider has been added to support OIDC. See the [documentation](https://rancher.com/docs/rancher/v2.6/en/admin-settings/authentication/keycloak-oidc/) and [#30280](https://github.com/rancher/rancher/issues/30280).
- **Catalog performance enhancement:** Catalogs will be greatly reduced in size, depending on their contents. See [#32938](https://github.com/rancher/rancher/issues/32938).

# Security Fixes

- **Improved audit logs:** Audit logs level 2+ no longer output sensitive data (Passwords) in plain text. See [#33338](https://github.com/rancher/rancher/pull/33338).
- **Restricted admin permissions:** Permissions for a user with a "Restricted Admin" role have been fixed so that the user is able to perform the following operations, even though they have restricted access to the local cluster:
  - Deploy AKS/GKE/EKS clusters

# Major Bug Fixes

- Fix workload environment variables interpolation order by deprecating our custom `environment` and `environmentFrom` types in favor of Kubernetes `env` and `envFrom` native types. See [#16148](https://github.com/rancher/rancher/issues/16148).
- EKS, AKS, and GKE provisioners now correctly use any additional CAs passed to Rancher, if provided. See [#31846](https://github.com/rancher/rancher/issues/31846).
- The GKE cluster provisioner now handles differences in supported Kubernetes versions across regions. See [#33524](https://github.com/rancher/rancher/issues/33524).
- The GKE cluster provisioner was updated to handle changes to how the provider configures public and private clusters. See [#33241](https://github.com/rancher/rancher/issues/33241).
- The EKS cluster provisioner now correctly adds labels to clusters without causing the cluster to be in a perpetual updating state. See [#33302](https://github.com/rancher/rancher/issues/33302).
- Global DNS app gets uninstalled/removed immediately after install due to OwnerReferences cleanup enforced in Kubernetes v1.20. Instead of relying on the ownerReference for deletion of the app after GlobalDNSProvider is removed, fix is added to handle the delete event in the controller to remove the app. See [#31638](https://github.com/rancher/rancher/issues/31638).
- Project Network Isolation ingress NetworkPolicy resources now get configured correctly when using Calico CNI with IPIP or VXLAN routing. See [#33979](https://github.com/rancher/rancher/issues/33979).
- The Multi-cluster management feature flag can now only be disabled when starting Rancher. Previously, disabling the flag through the UI would result in a `404 page not found` error. See [#32721](https://github.com/rancher/rancher/issues/32721).
- Users can now use the `answersSetString` field to ensure values are passed as a string as expected by the app being configured. See [#26088](https://github.com/rancher/rancher/issues/26088).
- The health status of the Controller Mananger and Scheduler on the dashboard will show as `Not Applicable` on clusters where the componentstatus is not available. See [#11496](https://github.com/rancher/rancher/issues/11496).
- Custom encryption configuration is no longer required to be case sensitive. See [#31385](https://github.com/rancher/rancher/issues/31385)
- The `rancher.cattle.io` MutatingWebhookConfiguration object is now deleted when Rancher is uninstalled, which would otherwise cause failures reinstalling Rancher on the same cluster. See [#33988](https://github.com/rancher/rancher/issues/33988)

# Install/Upgrade Notes

> If you are installing Rancher for the first time, your environment must fulfill the [installation requirements.](https://rancher.com/docs/rancher/v2.6/en/installation/requirements/)

### Upgrade Requirements

- **Creating backups:** We strongly recommend creating a backup before upgrading Rancher. To roll back Rancher after an upgrade, you must back up and restore Rancher to the previous Rancher version. Because Rancher will be restored to its state when a backup was created, any changes post upgrade will not be included after the restore. For more information, see the [documentation on backing up Rancher.](https://rancher.com/docs/rancher/v2.5/en/backups/back-up-rancher/)
- **Helm version:** Rancher install or upgrade must occur with Helm 3.2.x+ due to the changes with the latest cert-manager release. See [#29213](https://github.com/rancher/rancher/issues/29213).
- **Kubernetes version:** The local Kubernetes cluster for the Rancher server should be upgraded to Kubernetes 1.17+ before installing Rancher 2.5+.
- **CNI requirements:**
  - For K8s 1.19 and newer, we recommend disabling firewalld as it has been found to be incompatible with various CNI plugins. See [#28840](https://github.com/rancher/rancher/issues/28840).
  - For users upgrading from `>=v2.4.4` to `v2.5.x` with clusters where ACI CNI is enabled, note that upgrading Rancher will result in automatic cluster reconciliation. This is applicable for Kubernetes versions `v1.17.16-rancher1-1`, `v1.17.17-rancher1-1`, `v1.17.17-rancher2-1`, `v1.18.14-rancher1-1`, `v1.18.15-rancher1-1`, `v1.18.16-rancher1-1`, and `v1.18.17-rancher1-1`. Please refer to the [workaround](https://github.com/rancher/rancher/issues/32002#issuecomment-818374779) BEFORE upgrading to `v2.5.x`. See [#32002](https://github.com/rancher/rancher/issues/32002).
- **Requirements for air gapped environments:**
  - For installing or upgrading Rancher in an air gapped environment, please add the flag `--no-hooks` to the `helm template` command to skip rendering files for Helm's hooks. See [#3226](https://github.com/rancher/docs/issues/3226).
  - If using a proxy in front of an air gapped Rancher, you must pass additional parameters to `NO_PROXY`. See the [documentation](https://rancher.com/docs/rancher/v2.5/en/installation/other-installation-methods/behind-proxy/install-rancher/) and [#2725](https://github.com/rancher/docs/issues/2725#issuecomment-702454584).
- **Cert-manager version requirements:** Recent changes to cert-manager require an upgrade if you have a high-availability install of Rancher using self-signed certificates. If you are using cert-manager older than v0.9.1, please see the documentation on how to upgrade cert-manager. See [documentation](https://rancher.com/docs/rancher/v2.5/en/installation/resources/upgrading-cert-manager/).
- **Requirements for Docker installs:**
  - When starting the Rancher Docker container, the privileged flag must be used. [See the documentation.](https://rancher.com/docs/rancher/v2.5/en/installation/other-installation-methods/single-node-docker/)
  - When installing in an air gapped environment, you must supply a custom `registries.yaml` file to the `docker run` command as shown in the [K3s documentation](https://rancher.com/docs/k3s/latest/en/installation/private-registry/). If the registry has certs, then you will need to also supply those. See [#28969](https://github.com/rancher/rancher/issues/28969#issuecomment-694474229).
  - When upgrading a Docker installation, a panic may occur in the container, which causes it to restart. After restarting, the container comes up and is working as expected. [#33685](https://github.com/rancher/rancher/issues/33685)

### Rancher Behavior Changes

- **Legacy features are gated behind a feature flag.** Users upgrading from Rancher <=v2.5.x will automatically have the `--legacy` feature flag enabled. New installations that require legacy features need to enable the flag on install or through the UI.
- **The local cluster can no longer be turned off.** In older Rancher versions, the local cluster could be hidden to restrict admin access to the Rancher server's local Kubernetes cluster, but that feature has been deprecated. The local Kubernetes cluster can no longer be hidden and all admins will have access to the local cluster. If you would like to restrict permissions to the local cluster, there is a new [restricted-admin role](https://rancher.com/docs/rancher/v2.6/en/admin-settings/rbac/global-permissions/#restricted-admin) that must be used. The access to local cluster can now be disabled by setting `hide_local_cluster` to true from the v3/settings API. See the [documentation](https://rancher.com/docs/rancher/v2.6/en/admin-settings/rbac/global-permissions/#restricted-admin) and [#29325](https://github.com/rancher/rancher/issues/29325). For more information on upgrading from Rancher with a hidden local cluster, see [the documentation.](https://rancher.com/docs/rancher/v2.5/en/admin-settings/rbac/global-permissions/#upgrading-from-rancher-with-a-hidden-local-cluster)
- **Users must log in again.** After upgrading to `v2.6+`, users will be automatically logged out of the old Rancher UI and must log in again to access Rancher and the new UI. See [#34004](https://github.com/rancher/rancher/issues/34004).
- **Fleet is now always enabled.** For users upgrading from `v2.5.x` to `v2.6.x`, note that Fleet will be enabled by default as it is required for operation in `v2.6+`. This will occur even if Fleet was disabled in `v2.5.x`. During the upgrade process, users will observer restarts of the `rancher` pods, which is expected. See [#31044](https://github.com/rancher/rancher/issues/31044) and [#32688](https://github.com/rancher/rancher/issues/32688).
- **Editing and saving clusters can result in cluster reconciliation.** For users upgrading from `<=v2.4.8 (<= RKE v1.1.6)` to `v2.4.12+ (RKE v1.1.13+)`/`v2.5.0+ (RKE v1.2.0+)` , please note that Edit and save cluster (even with no changes or a trivial change like cluster name) will result in cluster reconciliation and upgrading `kube-proxy` on all nodes [because of a change in `kube-proxy` binds](https://github.com/rancher/rke/pull/2214#issuecomment-680001568). This only happens on the first edit and later edits shouldn't affect the cluster. See [#32216](https://github.com/rancher/rancher/issues/32216).
- **The EKS cluster refresh interval setting changed.** There is currently a setting allowing users to configure the length of refresh time in cron format: `eks-refresh-cron`. That setting is now deprecated and has been migrated to a standard seconds format in a new setting: `eks-refresh`. If previously set, the migration will happen automatically. See [#31789](https://github.com/rancher/rancher/issues/31789).
- **System components will restart.** Please be aware that upon an upgrade to v2.3.0+, any edits to a Rancher launched Kubernetes cluster will cause all system components to restart due to added tolerations to Kubernetes system components. Plan accordingly.
- **New GKE and AKS clusters will use Rancher's new lifecycle management features.** Existing GKE and AKS clusters and imported clusters will continue to operate as-is. Only new creations and registered clusters will use the new full lifecycle management.
- **New steps for rolling back Rancher**: The process to roll back Rancher has been updated for versions v2.5.0 and above. New steps require scaling Rancher down to 0 replica before restoring the backup. Please refer to the [documentation](https://rancher.com/docs/rancher/v2.6/en/installation/install-rancher-on-k8s/rollbacks/) for the new instructions.
- **RBAC differences around Manage Nodes for RKE2 clusters** Due to the change of the provisioning framework, the `Manage Nodes` role will no longer be able to scale up/down machine pools. The user would need the ability to edit the cluster to manage the machine pools [#34474](https://github.com/rancher/rancher/issues/34474).
- **Machines vs Kube Nodes** In previous versions, Rancher only displayed Nodes, but with v2.6, there are the concepts of `machines` and `kube nodes`. Kube nodes are the Kubernetes node objects and are only accessible if the Kubernetes API server is running and the cluster is active. Machines are the cluster's machine object which defines what the cluster *should* be running.
- **Requirements for Docker installs:**
  - When starting the Rancher Docker container, the privileged flag must be used. [See the documentation.](https://rancher.com/docs/rancher/v2.5/en/installation/other-installation-methods/single-node-docker/)
  - When installing in an air gapped environment, you must supply a custom `registries.yaml` file to the `docker run` command as shown in the [K3s documentation](https://rancher.com/docs/k3s/latest/en/installation/private-registry/). If the registry has certs, then you will need to also supply those. See [#28969](https://github.com/rancher/rancher/issues/28969#issuecomment-694474229).

# Versions

Please refer to the [README](https://github.com/rancher/rancher#latest-release) for latest and stable versions.

Please review our [version documentation](https://rancher.com/docs/rancher/v2.6/en/installation/resources/choosing-version/) for more details on versioning and tagging conventions.

### Images
- rancher/rancher:v2.6.0

### Tools
- CLI - [v2.4.12](https://github.com/rancher/cli/releases/tag/v2.4.12)
- RKE - [v1.3.0](https://github.com/rancher/rke/releases/tag/v1.3.0)

### Rancher Helm Chart Versions

Starting in 2.6.0 many of the Rancher Helm charts available in the Apps & Marketplace will start with a major version of 100. This was done to avoid simultaneous upstream changes and Rancher changes from causing conflicting version increments. This also brings us into compliance with semver, which is a requirement for newer versions of Helm. You can now see the upstream version of a chart in the build metadata, for example: `100.0.0+up2.1.0`. See [#32294](https://github.com/rancher/rancher/issues/32294).

# Other Notes

### Feature Flags
Please review the new feature flags introduced into 2.6.0 and their default status.

Feature Flag | Default Value | Description
---|---|---
`fleet`| `true` | The previous `fleet` feature flag is now required to be enabled as the fleet capabilities are leveraged within the new provisioning framework. If you had this feature flag disabled in earlier versions, upon upgrading to Rancher, the flag will automatically be enabled.
`gitops` | `true` | If you want to hide the "Continuous Delivery" feature from your users, then please use the the newly introduced `gitops` feature flag, which hides the ability to leverage Continuous Delivery.
`rke2` | `true` | 	We have introduced the ability to provision RKE2 clusters as tech preview. By default, this feature flag is enabled, which allows users to attempt to provision these type of clusters.
`legacy` | `false` for new installs, `true` for upgrades | There are a set of features from previous versions that are slowly being phased out of Rancher for newer iterations of the feature. This is a mix of deprecated features as well as features that will eventually be moved to newer variations in Rancher. By default, this feature flag is disabled for new installations. If you are upgrading from a previous version, this feature flag would be enabled.
`token-hashing` | `false` for new installs, `true` for upgrades | Used to enable new token-hashing feature. Once enabled, existing tokens will be hashed and all new tokens will be hashed automatically using the SHA256 algorithm. Once a token is hashed it cannot be undone. Once this feature flag is enabled it cannot be disabled.

### Experimental Features

RancherD was introduced in 2.5 as an easy-to-use installation binary. With the introduction of RKE2 provisioning, this project is being re-written and will be available at a later time. See [#33423](https://github.com/rancher/rancher/issues/33423).

### Legacy Features

Legacy features are features hidden behind the `legacy` feature flag, which are various features/functionality of Rancher that was available in previous releases. These are features that Rancher doesn't intend for new users to consume, but if you have been using past versions of Rancher, you'll still want to use this functionality.

When you first start 2.6, there is a card in the Home page that outlines the location of where these features are now located.

The deprecated features from v2.5 are now behind the `legacy` feature flag. Please review our [deprecation policy](https://rancher.com/support-maintenance-terms/) for questions.

The following legacy features are no longer supported on Kubernetes 1.21+ clusters:
* Logging (Legacy)
* CIS Scans (Legacy)
* Istio 1.5
* Pipelines

### Known Major Issues

- **Kubernetes Cluster Distributions**
  - **RKE**
    - Rotating encryption keys with a custom encryption provider is not supported. See [#30539](https://github.com/rancher/rancher/issues/30539).
  - **RKE2 - Tech Preview**: There are several known issues as this feature is in tech preview, but here are some major issues to consider before using RKE2.
    - Sometimes the nodes may not be cleaned up in the infrastructure provider when deleting clusters or nodes. Please be sure to review the actual nodes after cleaning up a cluster. See [#34542](https://github.com/rancher/rancher/issues/34542).
    - There are issues around removing etcd nodes from a cluster. See [#34488](https://github.com/rancher/rancher/issues/34488).
    - Amazon ECR Private Registries are not functional. See [#33920](https://github.com/rancher/rancher/issues/33920).
    - Proxy behind individual downstream clusters is not working. See [#32633](https://github.com/rancher/rancher/issues/32633).
    - Cloud providers are not working for Azure clusters. See [#34367](https://github.com/rancher/rancher/issues/34367).
    - Windows Containers are not supported on Windows Server Standard Edition. Windows Server Datacenter Edition is required. See [#72](https://github.com/rancher/windows/issues/72).
    - Windows clusters do not yet support Rancher Apps & Marketplace [#34405](https://github.com/rancher/rancher/issues/34405)
  - **AKS:**
    - When upgrading the Kubernetes version in an AKS cluster, do not add a node pool at the same time. These actions must be done separately. See [#33426](https://github.com/rancher/rancher/issues/33426).
    - When editing or upgrading the AKS cluster, do not make changes from the Azure console or CLI at the same time. These actions must be done separately. See [#33561](https://github.com/rancher/rancher/issues/33561)
    - Windows node pools are not currently supported. See [#32586](https://github.com/rancher/rancher/issues/32586).
    - When upgrading an AKS cluster Kubernetes minor versions cannot be skipped. All upgrades must be performed sequentially by major version number. See [#34161](https://github.com/rancher/rancher/issues/34161)
  - **GKE**
    - Basic authentication must be explicitly disabled in GCP before upgrading a GKE cluster to 1.19+ in Rancher. See [#32312](https://github.com/rancher/rancher/issues/32312).
- **Cluster Tools:**
  - **Fleet:**:
    - Multiple `fleet-agent` pods may be created and deleted during initial downstream agent deployment; rather than just one. This resolves itself quickly, but is unintentional behavior. See [#33293](https://github.com/rancher/rancher/issues/33293).
  - **Hardened clusters:** Not all cluster tools are currently installable on a hardened cluster.
  - **Rancher Backup:**
    - When migrating to a cluster with the Rancher Backup feature, the server-url cannot be changed to a different location. It must continue to use the same URL.
    - When running a newer version of the rancher-backup app to restore a backup made with an older version of the app, the resourceSet rancher-resource-set will be restored to an older version that might be different from the one defined in the current running rancher-backup app. The workaround is to edit the rancher-backup app to trigger a reconciliation. See [#34495](https://github.com/rancher/rancher/issues/34495).
  - **Monitoring**
    - Deploying Monitoring on a Windows cluster with win_prefix_path set requires users to deploy Rancher Wins Upgrader to restart wins on the hosts to start collecting metrics in Prometheus. See [#32535](https://github.com/rancher/rancher/issues/32535).
  - **Logging**
    - Windows nodeAgents are not deleted when performing helm upgrade after disabling Windows logging on a Windows cluster. See [#32325](https://github.com/rancher/rancher/issues/32325).
  - **Istio versions:**
    - Istio v1.10.4 will be available with the Rancher Istio Helm chart v100.0.0+up1.10.4. A previous version of Istio, 1.10.2, included a security fix for CVE-2021-34824. See [#32795](https://github.com/rancher/rancher/issues/32795).
    - Istio 1.9 support ends on August 18th, 2021.
    - Istio 1.5 is not supported in air gapped environments. Please note that the Istio project has ended support for Istio 1.5.
    - The Kiali dashboard bundled with 100.0.0+up1.10.2 errors on a page refresh. Instead of refreshing the page when needed, simply access Kiali using the dashboard link again. The everything else works in Kiali as expected, including the graph auto-fresh. See [#33739](https://github.com/rancher/rancher/issues/33739).
    - When v1 Istio is installed in a cluster, the side navigation will incorrectly show a top-level 'Istio' menu item. This should be ignored for v1 Istio and users should instead use the Istio functionality under the 'Legacy' top-level menu item (this requires the legacy feature flag to be enabled).
  - **Legacy Monitoring**
    - The Grafana instance inside Cluster Manager's Monitoring is not compatible with Kubernetes 1.21. See [#33465](https://github.com/rancher/rancher/issues/33465).
    - In air gapped setups, the generated `rancher-images.txt` that is used to mirror images on private registries does not contain the images required to run Legacy Monitoring, also called Monitoring V1, which is compatible with Kubernetes 1.15 clusters. If you are running Kubernetes 1.15 clusters in an air gapped environment, and you want to either install Monitoring V1 or upgrade Monitoring V1 to the latest that is offered by Rancher for Kubernetes 1.15 clusters, you will need to take one of the following actions:
      - Upgrade the Kubernetes version so that you can use v0.2.x of the Monitoring application Helm chart
      - Manually import the necessary images into your private registry for the Monitoring application to use
    - When deploying any downstream cluster, Rancher logs errors that seem to be related to Monitoring even when Monitoring is not installed onto either cluster; specifically, Rancher logs that it `failed on subscribe` to the Prometheus CRs in the cluster because it is unable to get the resource `prometheus.meta.k8s.io`. These logs appear in a similar fashion for other Prometheus CRs (namely alertmanager, servicemonitors, and prometheusrules), but do not seem to cause any other major impact in functionality. See [#32978](https://github.com/rancher/rancher/issues/32978).
- **Docker installs:** There are UI issues around startup time. See [#28800](https://github.com/rancher/rancher/issues/28800) and [#28798](https://github.com/rancher/rancher/issues/28798).
- **Login to Rancher using ActiveDirectory with TLS:** See [#34325](https://github.com/rancher/rancher/issues/34325).
  - Upon an upgrade to v2.6.0, authenticating via Rancher against an ActiveDirectory server using TLS can fail if the certificates on the AD server do not support SAN attributes. This is a check enabled by default in Golang 1.15.
  - The error received is "Error creating ssl connection: LDAP Result Code 200 "Network Error": x509: certificate relies on legacy Common Name field, use SANs or temporarily enable Common Name matching with GODEBUG=x509ignoreCN=0"
  - To resolve this, the certificates on the AD server should be updated or replaced with new ones that support the SAN attribute. Alternatively this error can be ignored by setting "GODEBUG=x509ignoreCN=0" as an environment variable to Rancher server container.
