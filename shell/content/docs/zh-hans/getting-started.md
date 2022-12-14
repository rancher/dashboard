---
title: 开始使用
sideToc: false
---

# 开始使用

本指南提供了 UI 的基本介绍。

如果你以前使用的是 Cluster Manager UI，请查看下面的指南，了解在新的 UI 中你可以在哪里访问相应的功能。

## 首页

首次登录 Rancher 时，你会访问新的主页。这里包括了许多信息卡片。你可以使用 <i class="icon icon-close doc-icon"></i> 图标来关闭这些卡片。如果要恢复隐藏的卡片，请单击右上方的 <i class="icon icon-actions doc-icon"></i> 图标，然后选择 "恢复隐藏的卡片"。

你可以从主页和偏好设置页面改变登录时显示的页面。要访问用户偏好设置页面，请单击右上角的用户头像图标，然后从菜单中选择“偏好设置”。
### 顶层菜单

新的滑入式菜单让你能快速访问集群和应用程序。点击 <svg class="doc-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none" /><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg> 图标（左上角）即可进行访问。



## 从 Cluster Manager 迁移

从 Rancher 2.6 开始，Cluster Manager 不再作为一个单独的 UI。我们已增强 Dashboard UI 以提供 Cluster Manager 的功能。因此，Cluster Manager 的功能在新的 UI 中的位置可能不同，本指南会帮助你找到所需的功能。

> 请注意，你需要启用旧版功能标志才能使用旧版功能。你可以从滑入式菜单 → 全局设置 → 功能开关中启用该功能。

<table>
  <thead>
    <tr>
      <th>功能</th>
      <th>Cluster Manager 位置</th>
      <th>新位置</th>
    </tr>
  </thead>
  <tbody>
    <tr class="table-group">
      <td colspan="3">集群配置</td>
    </tr>
    <tr>
      <td>集群列表</td>
      <td>全局 → 集群</td>
      <td>菜单 → 集群管理 → 集群</td>
    </tr>
    <tr>
      <td>驱动</td>
      <td>全局 → 工具 → 驱动</td>
      <td>菜单 → 集群管理 → 驱动</td>
    </tr>
    <tr>
      <td>RKE1 模板</td>
      <td>全局 → 工具 → RKE 模板</td>
      <td>菜单 → 集群管理 → RKE1 配置 → RKE 模板</td>
    </tr>
    <tr>
      <td>RKE1 云凭证</td>
      <td>用户图标 → 云凭证</td>
      <td>菜单 → 集群管理 → RKE1 配置 → 云凭证</td>
    </tr>
    <tr>
      <td>RKE1 节点模板</td>
      <td>用户图标 → 节点模板</td>
      <td>菜单 → 集群管理 → RKE1 配置 → 节点模板</td>
    </tr>
    <tr>
      <td>RKE1 快照</td>
      <td>全局 → 集群 → 快照</td>
      <td>菜单 → 集群管理 →（集群）→ 快照</td></td>
    </tr>
    <!-- -->
    <tr class="table-group">
      <td colspan="3">全局</td>
    </tr>
    <tr>
      <td>设置</td>
      <td>全局 → 设置</td>
      <td>菜单 → 全局设置</td>
    </tr>
    <tr>
      <td>应用商店</td>
      <td>全局 → 工具 → 应用商店</td>
      <td>菜单 → 全局设置 → 应用商店</td>
    </tr>
    <tr>
      <td>全局 DNS 条目</td>
      <td>全局 → 工具 → 全局 DNS 条目</td>
      <td>菜单 → 全局设置 → 全局 DNS 条目</td>
    </tr>
    <tr>
      <td>全局 DNS 提供商</td>
      <td>全局→ 工具 → 全局 DNS 提供商</td>
      <td>菜单 → 全局设置 → 全局 DNS 提供商</td>
    </tr>
    <tr>
      <td>Pod 安全策略</td>
      <td>全局 → 安全 → Pod 安全策略</td>
      <td>菜单 → 集群管理 → Pod 安全策略</td>
    </tr>
    <!-- -->
    <tr class="table-group">
      <td colspan="3">集群功能（针对特定集群）</td>
    </tr>
    <tr>
      <td>集群</td>
      <td>（集群）→ 集群</td>
      <td>菜单 →（集群）→ 集群</td>
    </tr>
    <tr>
      <td>节点</td>
      <td>（集群）→ 节点</td>
      <td>菜单 →（集群）→ 集群 → Kube 节点</td>
    </tr>
    <tr>
      <td>项目/命名空间</td>
      <td>（集群）→ 项目/命名空间</td>
      <td>菜单 →（集群）→ 集群 → 项目/命名空间</td>
    </tr>
    <tr>
      <td>Alerts (V1)</td>
      <td>（集群）→ 工具 → Alerts</td>
      <td>菜单 →（集群）→ 旧版 → Alerts</td>
    </tr>
    <tr>
      <td>应用商店</td>
      <td>（集群）→ 工具 → 应用商店</td>
      <td>菜单 →（集群）→ 旧版 -> 应用商店</td>
    </tr>
    <tr>
      <td>Notifiers (V1)</td>
      <td>（集群）→ 工具 → Notifiers</td>
      <td>菜单 →（集群）→ 旧版 -> Notifiers</td>
    </tr>
    <tr>
      <td>Monitoring (V1)</td>
      <td>（集群）→ 工具 → Monitoring</td>
      <td>菜单 → （集群）→ 集群工具 → Monitoring（旧版）</td>
    </tr>
    <tr class="table-group">
      <td colspan="3">V1 Monitoring</td>
    <tr>
      <td>集群指标</td>
      <td>（集群）→ 集群</td>
      <td>菜单 →（集群）→ 集群</td>
    </tr>
    <tr>
      <td>节点指标</td>
      <td>（集群）→ 节点 →（节点）</td>
      <td>菜单 →（集群）→ 集群 → 节点 →（节点）</td>
    </tr>
    <tr>
      <td>工作负载指标</td>
      <td>（集群）→（项目）→ 资源 → 工作负载 →（工作负载）→ 工作负载指标</td>
      <td>菜单 →（集群）→ Deployments →（Deployment）→ 指标</td>
    </tr>
    <tr>
      <td>Pod 指标</td>
      <td>（集群）→（项目）→ 资源 → 工作负载 →（工作负载）→ Pod → (Pod) → Pod 指标</td>
      <td>菜单 →（集群）→ Deployments →（Deployment）→ Pod → (Pod) → 指标</td>
    </tr>
    </tr>
    <tr class="table-group">
      <td colspan="3">项目</td>
    </tr>
    <tr>
      <td>命名空间</td>
      <td>（集群）→（项目）→ 命名空间</td>
      <td>菜单 →（集群）→ 集群 → 项目/命名空间</td>
    </tr>
    <tr>
      <td>应用</td>
      <td>（集群）→（项目）→ 应用</td>
      <td>菜单 →（集群）→ 旧版 → 项目 → 应用</td>
    </tr>
    <tr>
      <td>告警</td>
      <td>（集群）→（项目）→ 工具 → Alerts</td>
      <td>菜单 →（集群）→ 旧版 → 项目 →（项目）→ Alerts</td>
    </tr>
    <tr>
      <td>应用商店</td>
      <td>（集群）→（项目）→ 工具 → 应用商店</td>
      <td>菜单 →（集群）→ 旧版 → 项目 →（项目）→ 应用商店</td>
    </tr>
    <tr>
      <td>Logging</td>
      <td>（集群）→（项目）→ 工具 → Logging</td>
      <td>菜单 →（集群）→ 旧版 → 项目 →（项目）→ Logging</td>
    </tr>
    <tr>
      <td>监控</td>
      <td>（集群）→（项目）→ 工具 → Monitoring</td>
      <td>菜单 →（集群）→ 旧版 → 项目 →（项目）→ Monitoring</td>
    </tr>
    <tr class="table-group">
      <td colspan="3">其他</td>
    </tr>
    <tr>
      <td>Kubeconfig 下载</td>
      <td>（集群）→ 集群 → Kubeconfig 文件</td>
      <td>菜单 →（集群）→ 集群 → 文件图标（右上角）</td>
    </tr>
    <tr>
      <td>CLI 下载</td>
      <td>底栏</td>
      <td>菜单 → 版本</td>
    </tr>
    <tr>
      <td>镜像列表下载</td>
      <td>底栏 → 版本</td>
      <td>菜单 → 版本</td>
    </tr>
    <tr>
      <td>API &amp; 密钥</td>
      <td>用户头像 → API 和密钥</td>
      <td>用户头像 → 账号 &amp; API 密钥</td>
    </tr>
    <tr>
      <td>偏好设置</td>
      <td>用户头像 → 偏好设置</td>
      <td>用户头像 → 偏好设置</td>
    </tr>    
  </tbody>
</table>
