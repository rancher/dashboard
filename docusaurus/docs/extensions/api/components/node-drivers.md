# Custom Node Driver UI

Rancher allows UI to be created for custom Node Drivers by registering components for the following two component types:

- `cloud-credential`
  - defines a custom component for collecting data for a cloud credential for a given node driver
  - If no cloud credentials are required, the extension can just set the component to `false`
- `machine-config`
  - defined a custom component for the machine pool configuration for a cloud credential for a given node driver

In both cases, the `ID` when registering should match the Node Driver name.

For more information, see: [Machine Drivers](../../../code-base-works/machine-drivers).
<!-- 
## Cloud Credentials

## Machine Configuration
 -->
