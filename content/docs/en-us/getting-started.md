---
title: Getting Started
sideToc: false
---

# Getting Started

This short guide provides a basic introduction to the UI.

If you have previously been using the Cluster Manager UI, check out the guide below to learn where you can access the equivalent functionality in the new UI.

## Home

When you first login to Rancher you'll be taken to the new Home page. There are a number of information cards presented. You can close these using the <i class="icon icon-close doc-icon"></i> icon. If you wish to bring back the hidden cards, open the page menu using the <i class="icon icon-actions doc-icon"></i>  icon in the top-right and choose 'Restore hidden cards'.

You can change where you land when you login from the Home page and also from the Preferences page. To access User Preferences, click on the user avatar icon in the top right and choose 'Preferences' from the menu.
### Top-level Menu

The new slide-in menu provides quick access to your clusters and apps. It is accessible by clicking on the <svg class="doc-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none" /><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg> icon in the top-left.



## Migrating from Cluster Manager

As of version 2.6, Cluster Manager is no longer provided as a separate UI. The dashboard UI has been enhanced to provide the functionality from Cluster Manager. As a result, functionality you might be familiar with from Cluster Manager can be found in slightly different locations within the new UI - this guide helps you find what you're looking for.

> Note that the legacy feature flag needs to be enabled for legacy functionality to be available. You can enable this from the slide-in menu → Global Settings → Feature Flags.

<table>
  <thead>
    <tr>
      <th>Feature</th>
      <th>Cluster Manager Location</th>
      <th>New Location</th>
    </tr>
  </thead>
  <tbody>
    <tr class="table-group">
      <td colspan="3">Cluster Provisioning</td>
    </tr>
    <tr>
      <td>Clusters List</td>
      <td>Global → Clusters</td>
      <td>Menu → Cluster Management → Clusters</td>
    </tr>
    <tr>
      <td>Drivers</td>
      <td>Global → Tools → Drivers</td>
      <td>Menu → Cluster Management → Drivers</td>
    </tr>
    <tr>
      <td>RKE1 Templates</td>
      <td>Global → Tools → RKE Templates</td>
      <td>Menu → Cluster Management →  RKE1 Configuration → RKE Templates</td>
    </tr>
    <tr>
      <td>RKE1 Cloud Credentials</td>
      <td>User Icon → Cloud Credentials</td>
      <td>Menu → Cluster Management → RKE1 Configuration → Cloud Credentials</td>
    </tr>
    <tr>
      <td>RKE1 Node Templates</td>
      <td>User Icon → Node Templates</td>
      <td>Menu → Cluster Management → RKE1 Configuration → Node Templates</td>
    </tr>
    <tr>
      <td>RKE1 Snapshots</td>
      <td>Global → Clusters → Snapshots</td>
      <td>Menu → Cluster Management → (Cluster) → Snapshots</td></td>
    </tr>
    <!-- -->
    <tr class="table-group">
      <td colspan="3">Global</td>
    </tr>
    <tr>
      <td>Apps</td>
      <td>Global → Apps</td>
      <td>Menu → Multi-cluster Apps → Apps</td>
    </tr>
    <tr>
      <td>Settings</td>
      <td>Global → Settings</td>
      <td>Menu → Global Settings</td>
    </tr>
    <tr>
      <td>Catalogs</td>
      <td>Global → Tools → Catalogs</td>
      <td>Menu → Multi-cluster Apps → Catalogs</td>
    </tr>
    <tr>
      <td>Global DNS Entries</td>
      <td>Global → Tools → Global DNS Entries</td>
      <td>Menu → Multi-cluster Apps → Global DNS Entries</td>
    </tr>
    <tr>
      <td>Global DNS Providers</td>
      <td>Global → Tools → Global DNS Providers</td>
      <td>Menu → Multi-cluster Apps → Global DNS Providers</td>
    </tr>
    <tr>
      <td>Pod Security Policies</td>
      <td>Global → Security → Pod Security Policies</td>
      <td>Menu → Cluster Management → Advanced → Pod Security Policies</td>
    </tr>
    <!-- -->
    <tr class="table-group">
      <td colspan="3">Cluster Functionality (for a specific cluster)</td>
    </tr>
    <tr>
      <td>Cluster</td>
      <td>(Cluster) → Cluster</td>
      <td>Menu → (Cluster) → Cluster</td>
    </tr>
    <tr>
      <td>Nodes</td>
      <td>(Cluster) → Nodes</td>
      <td>Menu -> (Cluster) → Cluster → Kube Nodes</td>
    </tr>
    <tr>
      <td>Projects/Namespaces</td>
      <td>(Cluster) → Projects/Namespaces</td>
      <td>Menu -> (Cluster) → Cluster → Projects/Namespaces</td>
    </tr>
    <tr>
      <td>Alerts (V1)</td>
      <td>(Cluster) → Tools → Alerts</td>
      <td>Menu → (Cluster) → Legacy -> Alerts</td>
    </tr>
    <tr>
      <td>Catalogs</td>
      <td>(Cluster) → Tools → Catalogs</td>
      <td>Menu → (Cluster) → Legacy -> Catalogs</td>
    </tr>
    <tr>
      <td>Notifiers (V1)</td>
      <td>(Cluster) → Tools → Notifiers</td>
      <td>Menu → (Cluster) → Legacy -> Notifiers</td>
    </tr>
    <tr>
      <td>Logging (V1)</td>
      <td>(Cluster) → Tools → Logging</td>
      <td>Menu → (Cluster) → Cluster Tools -> Logging (Legacy)</td>
    </tr>
    <tr>
      <td>Monitoring (V1)</td>
      <td>(Cluster) → Tools → Monitoring</td>
      <td>Menu → (Cluster) → Cluster Tools -> Monitoring (Legacy)</td>
    </tr>
    <tr>
      <td>Istio (V1)</td>
      <td>(Cluster) → Tools → Istio</td>
      <td>Menu → (Cluster) → Cluster Tools -> Istio (Legacy)</td>
    </tr>
    <tr>
      <td>CIS Scans (V1)</td>
      <td>(Cluster) → Tools → CIS Scans</td>
      <td>Menu → (Cluster) → Legacy -> CIS Scans</td>
    </tr>
    <tr class="table-group">
      <td colspan="3">V1 Monitoring</td>
    <tr>
      <td>Cluster Metrics</td>
      <td>(Cluster) → Cluster</td>
      <td>Menu → (Cluster) → Cluster</td>
    </tr>
    <tr>
      <td>Node Metrics</td>
      <td>(Cluster) → Nodes → (Node)</td>
      <td>Menu → (Cluster) → Cluster → Nodes → (Node)</td>
    </tr>
    <tr>
      <td>Workload Metrics</td>
      <td>(Cluster) → (Project) → Resources → Workloads → (Workload) → Workload Metrics</td>
      <td>Menu → (Cluster) → Deployments → (Deployment) → Metrics</td>
    </tr>
    <tr>
      <td>Pod Metrics</td>
      <td>(Cluster) → (Project) → Resources → Workloads → (Workload) → Pods → (Pod) → Pod Metrics</td>
      <td>Menu → (Cluster) → Deployments → (Deployment) → Pods → (Pod) → Metrics</td>
    </tr>
    </tr>
    <tr class="table-group">
      <td colspan="3">Project</td>
    </tr>
    <tr>
      <td>Namespaces</td>
      <td>(Cluster) → (Project) → Namespaces</td>
      <td>Menu → (Cluster) → Cluster → Projects/Namespaces</td>
    </tr>
    <tr>
      <td>Apps</td>
      <td>(Cluster) → (Project) → Apps</td>
      <td>Menu → (Cluster) → Legacy → Project → Apps</td>
    </tr>
    <tr>
      <td>Alerts</td>
      <td>(Cluster) → (Project) → Tools → Alerts</td>
      <td>Menu → (Cluster) → Legacy → Project → (Project) → Alerts</td>
    </tr>
    <tr>
      <td>Catalogs</td>
      <td>(Cluster) → (Project) → Tools → Catalogs</td>
      <td>Menu → (Cluster) → Legacy → Project → (Project) → Catalogs</td>
    </tr>
    <tr>
      <td>Logging</td>
      <td>(Cluster) → (Project) → Tools → Logging</td>
      <td>Menu → (Cluster) → Legacy → Project → (Project) → Logging</td>
    </tr>
    <tr>
      <td>Monitoring</td>
      <td>(Cluster) → (Project) → Tools → Monitoring</td>
      <td>Menu → (Cluster) → Legacy → Project → (Project) → Monitoring</td>
    </tr>
    <tr>
      <td>Pipeline</td>
      <td>(Cluster) → (Project) → Tools → Pipeline</td>
      <td>Menu → (Cluster) → Legacy → Project → (Project) → Pipelines → Configuration</td>
    </tr>
    <tr class="table-group">
      <td colspan="3">Other</td>
    </tr>
    <tr>
      <td>Kubeconfig download</td>
      <td>(Cluster) → Cluster → Kubeconfig File</td>
      <td>Menu → (Cluster) → Cluster → File Icon (top-right)</td>
    </tr>
    <tr>
      <td>CLI download</td>
      <td>Bottom Bar</td>
      <td>Menu → Version</td>
    </tr>
    <tr>
      <td>Image Lists download</td>
      <td>Bottom Bar --> Version</td>
      <td>Menu → Version</td>
    </tr>
    <tr>
      <td>API & Keys</td>
      <td>User Avatar → API & Keys</td>
      <td>User Avatar → Account & API Keys</td>
    </tr>
    <tr>
      <td>Preferences</td>
      <td>User Avatar → Preferences</td>
      <td>User Avatar → Preferences</td>
    </tr>    
  </tbody>
</table>
