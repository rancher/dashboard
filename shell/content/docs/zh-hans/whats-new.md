---
title: 2.6 的新功能
---


## 2.6.7 的新功能

### Amazon Marketplace 账单

- 可以直接通过 AWS Marketplace 购买 Rancher 支持：https://rancher.com/docs/rancher/v2.6/en/installation/cloud-marketplace/aws/

### 使用 MSAL 配置 Azure AD

- 微软已弃用 Rancher 用于通过 Azure AD 进行身份认证的 Azure AD Graph API。因此需要更新配置以确保用户仍然可以同时使用 Rancher 和 Azure AD。有关详细信息，请参阅：https://rancher.com/docs/rancher/v2.6/en/admin-settings/authentication/azure-ad/#migrating-from-azure-ad-graph-api-to-microsoft-graph-api

### Kubernetes 1.24

- 支持使用 Kubernetes 1.24 运行 Rancher 以及导入的 RKE1/RKE2/K3s 集群。

### RKE2 加密密钥轮换

- RKE2 默认静态加密 Secret 数据。可以为由 Rancher 配置且具有受支持的 K8s 版本的 RKE2 集群轮换用于加密的密钥。


## 2.6.6 的新功能

- 2.6.6 的发布主要为了解决一个重要的性能问题。Rancher 试图控制下游集群的大量流量时会出现这个问题。此机制未正确处理断开的连接，并会导致无限期锁定。本版本已修复此问题。


## 2.6.5 的新功能

### NeuVector 集成

- 可以直接从 Rancher UI 访问 NeuVector。

### RKE2 配置已 GA

- 使用我们最新的 Kubernetes 发行版通过 Rancher 配置 RKE2 集群。

### 增强 Windows 支持

- Windows 的 RKE2 支持已 GA，包括适用于 Windows 的 vSphere 驱动。

### Prometheus Federator

- 使用 Rancher 项目在同一集群中的团队之间隔离指标数据。


## 2.6.4 的新功能

### Kubernetes 1.22 支持

- 配置 RKE1 集群以及升级导入的 RKE2/K3s 集群时支持 Kubernetes 1.22。

### 实验性 - Kubernetes 1.23 支持

- 配置 RKE1 集群以及升级导入的 RKE2/K3s 集群时支持 Kubernetes 1.23。由于 RKE1 集群没有发布上游 vSphere CPI/CSI Chart，以及 Windows RKE1 集群不支持双栈 IPv4/IPv6，因此这是实验功能。


## 2.6.3 的新功能

### Harvester 集成

- Harvester 与 Rancher 和 RKE1 配置的集成现已 GA。用户可以使用 RKE1 配置 Kubernetes 集群，并从单个 Rancher 实例管理多个 Harvester HCI 集群。
- 在 Harvester 上配置 RKE2 仍然处于技术预览阶段。

### 实验性 - Kubernetes 1.22 支持

- 配置集群以及升级导入的 RKE2/K3s 集群时支持 Kubernetes 1.22。

### 对授权集群端点 (ACE) 的支持扩展

- 集群管理员现在可以在导入的 RKE2/K3s 集群上配置 ACE。

### 工作负载 UX 增强

- Rancher UI 添加了工作负载指标仪表板。
- 添加了从主列表视图暂停编排、更新规模以及可视化 Deployment 运行状况的功能。

详情请参阅 [Release Notes](https://github.com/rancher/rancher/releases/tag/v2.6.3)。

## 2.6.0 的新功能

### 重新设计的 Rancher 用户体验

焕然一新的 UI，Kubernetes 初学者和高级用户都能轻松使用：

- 更新了 Cluster Explorer 导航，用户现在可以看到以简单术语表示的常用 Kubernetes 资源折叠子集。你可以通过 Explorer 管理任何 Kubernetes 资源，并使用资源搜索功能快速找到所需资源。用户现在可以管理他们的项目。Monitoring 和 Logging 等集群工具集中在**集群工具**菜单下。启用 Monitoring 后，集群仪表板将包含实时指标。
- 重新设计了全局导航，用户和管理员可以更轻松地在集群和顶层应用之间快速切换。
- **集群管理**列出了用户的所有集群，并通过左侧导航菜单得到了增强，所有集群生命周期工具都集中在同一位置。

### 增强的品牌和自定义选项

- 管理员可以在品牌管理页面管理 Rancher 中的徽标和颜色。
- 用户可以在 Cluster Explorer 导航中添加自己的应用链接。

### 增强的 AKS 生命周期管理
- 更新了 AKS 集群配置，支持私有 AKS 端点、多节点池、自动扩缩和使用 Rancher 云凭证进行身份认证。
- 可以注册现有的 AKS 集群，从而管理 Kubernetes 版本和配置。

### 增强的 GKE 生命周期管理
- 更新了 GKE 集群配置，支持共享 VPC、多节点池、自动扩缩和网络标签。
- 可以注册现有的 GKE 集群，从而管理 Kubernetes 版本和配置。
- 可以为通过 Rancher 配置或注册的 GKE 集群启用 Rancher 的项目网络隔离。

### 技术预览 - RKE2 集群配置

- 引入了建立在 Cluster API 上的新配置框架，用来支持 RKE2 集群配置。
- 可以配置 RKE2 集群，以便通过 Rancher 在各种云基础设施提供商（例如 AWS、Azure、vSphere、Linode 和 DigitalOcean）中启动 VM。
- RKE2 集群也可以在现有的虚拟或裸金属服务器上配置。

### 技术预览 - RKE2 Windows Worker 节点支持

- Windows Worker 节点可以添加到任何使用默认 Calico CNI 的 RKE2 自定义集群。

### 技术预览 - 集群模板

- 集群模板可用于控制能为集群自定义配置的参数。

集群可以定义的示例包括：
- 用于 etcd、control plane 和 Worker 的节点池。
- 用于配置节点的云凭证。

### 使用 OIDC 的 Keycloak

- 可以使用 OIDC 认证 Keycloak。

### 安全增强

- 管理员现在可以在 Rancher 和 Kubernetes 审计日志中通过用户名和身份提供程序 (IdP) 跟踪用户。
- 管理员可以启用 Rancher API Token 的单向哈希。

详情请参阅 [Release Notes](https://github.com/rancher/rancher/releases/tag/v2.6.0)。
