# Components

Rancher uses dynamic components in the Dashboard UI. Extensions can add components for Rancher to discover and use. 

For a hosted provider extension, the main component is called 'CruPROVISIONER_NAME' and contains fields required to provision a cluster. This is the main component which is being loaded when provider is selected in `Cluster Management -> Clusters -> Create` and `Cluster Management -> Clusters -> Import Existing`, and when an existing cluster of this provider type is being edited.

