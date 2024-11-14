# Custom Node Driver UI

Rancher supports custom node drivers to support additional node provisioners. Node drivers are used for both RKE1 and RKE2/k3s. RKE1 support is handled by the legacy ember UI.

Rancher Extensions allows users to develop custom UI experiences for configuring node drivers for use with RKE3/k3s.

Developing a custom node driver UI typically consists of developing two main components:

- A **Cloud Credential** component that is used to allow a user to supply and verify their credentials for interacting with the node driver
- A **Machine Configuration** component that is used to allow users to supply the necessary machine pool data for the node driver - example being the node type (CPU, memory, disk etc), the base OS etc.

An example custom Node Driver UI Extension that demonstrates a custom UI experience for Openstack is included in the Rancher Extensions example repository - see: https://github.com/rancher/ui-plugin-examples.
