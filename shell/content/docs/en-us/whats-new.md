---
title: What's New in 2.7
---

## New in 2.7.0

### k3s provisioning is GA (x86 Only)

- Provisioning K3s clusters on x86 clusters has graduated to GA! The fully compliant Kubernetes distribution is simplified, secure and at less than 60mb is perfect for Edge.

### Rancher Extensions

- Rancher Extensions provides a mechanism to extend the functionality of the Rancher Manager UI. Rancher will use this to provide new functionality that can be
installed by administrators. Extensions are provided as Helm charts. A new top-level 'Extensions' UI allows administrators to enable Extensions support and install and manage Extensions themselves.

### OCI Support for Helm for Fleet

- Authentication for OCI-based registries is now supported. Note that the structure of the fleet.yaml is the same and the credentials are provided as a Kubernetes secret, which is described in the Private Helm Repo box in the Repo Structure docs.

