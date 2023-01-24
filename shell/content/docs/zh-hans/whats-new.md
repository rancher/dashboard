---
title: 2.7 的新功能
---

## 2.7.0 的新功能

### K3s 配置已 GA（仅限 x86）

- 在 x86 集群上配置 K3s 集群已正式 GA！该 Kubernetes 发行版完全兼容、已经过简化、使用安全而且小于 60 MB，非常适合 Edge。

### Rancher 扩展

- Rancher Extensions 可用于扩展 Rancher Manager UI 的功能。Rancher 将使用它来提供新的功能。扩展以 Helm Chart 的形式提供。新的顶层“扩展”UI 允许管理员启用扩展支持并自行安装和管理扩展。

### OCI 对 Helm Fleet 的支持

- 现在支持对基于 OCI 的镜像仓库进行身份验证。请注意，fleet.yaml 的结构是相同的，并且凭证作为 Kubernetes Secret 提供（Repo Structure 文档的 Private Helm Repo 框中已进行了描述）。

