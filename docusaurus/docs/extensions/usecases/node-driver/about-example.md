# Node Driver Example

An example node driver UI Extension has been created for OpenStack - the source code is available in this
GitHub repository - https://github.com/rancher/ui-plugin-examples

This is a great starting point for creating your own extension for a Node Driver UI.

## Caveats

The OpenStack Node Driver provided by Rancher has a few limitations which are not generally encountered when you create a Node Driver extension - these are discussed below.

### Allow-list

Many node drivers communicate with cloud-based systems where the URL is constant and well-known - e.g. my-provider.com. The Node Driver added to Rancher will include this URL in its allow-list, which means the UI can proxy API calls to it.

For providers like OpenStack, the URL is not constant - it depends on each deployment.

The OpenStack UI Extension example catches `503` HTTP errors from the proxy API (which indicates that the proxy was not permitted) and offers to add the required URL to the allow-list for the node driver. Note that the user must have appropriate permissions in order to be able to do this.

### Private/Public Fields

The OpenStack node driver only declares `password` as a private field (see `privateCredentialFields` on the OpenStack `nodeDriver` custom resource). It does not define any public fields.

This means we can only store the password field on this resource.

For our OpenStack UI, we need to store additional fields, for example:

- Authentication URL
- Domain Name
- Username

To work around the node driver limitation, we store these additional fields as annotations. This is not encouraged and for a custom node driver, you should ensure that `privateCredentialFields` and `publicCredentialFields` are defined appropriately.

### Proxying

Rancher provides a proxying mechanism to get around CORS issues. This allows the UI to communicate with external APIs outside of Rancher.

Additionally, the proxying mechanism can insert private credential metadata into a proxied request. This allows calls to be made to backend APIs that require authentication without having to retrieve the private data from the backend.

This mechanism only supports adding credential fields into the auth header - for OpenStack, we need to send the password in a JSON body as part of a token request to the OpenStack API.

The OpenStack example extension works around this limitation by retrieving the secret associated with the corresponding cloud credential. This is generally discouraged and has the limitation that the user must be able to access secrets in order to do this, which may not be the case where permissions have been applied.
