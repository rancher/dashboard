# About Node Drivers

Custom Node Drivers can be created and registered with Rancher to allow it to provision nodes onto which RKE1/RKE2 or K3s can be installed.

## Registering a Node Driver

To tell Rancher about a new driver, go to:

`Cluster Management -> Drivers -> Node Drivers -> Add Node Driver`

You should:

- Set the URL the binary should be downloaded from. 
- If the UI will need to communicate with an API to show options (e.g getting data from `api.mycloudprovider.com`), add it to the list of Whitelist Domains.
- Click Create to save.

Rancher will download the Node Driver binary and once activated, it will become available in the UI using all the generic driver support.  

This just lists all the fields that the driver says it has and makes some guesses about likely sounding names.  The user ultimately has to figure out which ones are required or important and set those.

To improve the experience creating a cluster using your custom Node Driver:

- For RKE1, the legacy Ember UI is used and you can create an Ember extension and provide the URL to the Javascript package for it when you add the Node Driver to Rancher
- For RKE2 and K3s, you can create a Rancher Extension and add that to Rancher - this is the extension mechanism documented here

## Driver binary

For more advanced control, the machine driver custom resource supports several annotations:

| Key                      | Value                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| publicCredentialFields   | Fields that are considered "public" information and ok to display in cleartext for detail screens |
| privateCredentialFields  | Fields that are private information that should be stored as a secret                             |
| optionalCredentialFields | Fields that are related to the credential, but are optional for the user to fill out              |
| passwordFields           | Fields that should be displayed as type="password" bullets instead of cleartext                   |
| defaults                 | Default values to set which the user may override                                                 |

Each has a value that is a comma-separated list of field names.  `defaults` are comma-separated, then colon-separated for key and value (e.g. `foo:bar,baz:42`).  The annotations become information in API schemas, which the generic UI support uses to show better information.

The standard drivers included in Rancher and their options are defined [here](https://github.com/rancher/rancher/blob/release/v2.6/pkg/data/management/machinedriver_data.go).