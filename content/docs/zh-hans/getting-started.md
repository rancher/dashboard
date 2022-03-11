---
title: 快速开始
sideToc: false
---

# 入门

这个简短的指南提供了一个关于用户界面的基本介绍。

如果你以前一直在使用集群管理的用户界面，请查看下面的指南，以了解在新的用户界面中你可以在哪里访问相应的功能。

## 首页

当你第一次登录Rancher时，你会被带入新的主页。这里有许多信息卡。你可以使用<i class="icon icon-close doc-icon"></i>图标来关闭这些卡片。如果你想恢复隐藏的卡片，请使用右上方的<i class="icon icon-actions doc-icon"></i>图标打开页面菜单，选择 "恢复隐藏的卡片"。

你可以从主页和首选项页面来改变你登录时的位置。要访问用户偏好，请点击右上方的用户头像图标，并从菜单中选择'偏好'。

### 顶层菜单

新的滑入式菜单提供了对你的集群和应用程序的快速访问。点击<svg class="doc-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none" /><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg> 左上方的图标即可进入。

## 从集群管理器迁移

从2.6版本开始，集群管理不再作为一个单独的用户界面提供。Dashboard的用户界面已被增强，以提供来自集群管理的功能。因此，你可能熟悉的集群管理的功能可以在新的用户界面中找到稍微不同的位置 - 本指南帮助你找到你正在寻找的东西。

> 请注意，需要启用传统功能标志，以使传统功能可用。你可以从滑入式菜单→全局设置→功能标志中启用该功能。

<table>
  <thead>
    <tr>
      <th>特性</th>
      <th>集群管理位置</th>
      <th>新位置</th>
    </tr>
  </thead>
  <tbody>
    <tr class="table-group">
      <td colspan="3">集群配置</td>
    </tr>
    <tr>
      <td>集群列表</td>
      <td>全局 → Clusters</td>
      <td>菜单 → 管理集群 → Clusters</td>
    </tr>
    <tr>
      <td>Drivers</td>
      <td>Global → Tools → Drivers</td>
      <td>Menu → 管理集群 → Drivers</td>
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
