# Machine Drivers

A machine driver consists of:
  - The actual driver run inside the server container.  This can be built-in to `rancher-machine` or loaded as an external binary.
  - A component to create & edit the `cloud_credential` for the provider, which stores the user's auth information to talk to the provider API.
  - A component to create & edit the `machine_config`, which describes the size, location, and other options for a particular machine to be deployed to the provider.
  - An optional `model` to override properties of a generic `machine-template` object with details specific to this provider.
  - An optional `store` to facilitate communication with the provider's API and caching of information retrieved from it.

## Driver binary

To tell Rancher about a new driver, go to Cluster Management -> Drivers -> Node Drivers -> Add Node Driver.  Set the URL the binary should be downloaded from.  If the UI will need to communicate with an API to show options (e.g getting data from `api.mycloudprovider.com`), add it to the list of Whitelist Domains.  Click Create to save.  The driver is downloaded and loaded and becomes available in the UI using all the generic driver support.  This just lists all the fields that the driver says it has and makes some guesses about likely sounding names.  The user ultimately has to figure out which ones are required or important and set those.  To improve on that, continue reading.

For more advanced control, the machine driver custom resource supports several annotations:

| Key                       | Value                                                                                             |
| --------------------------|---------------------------------------------------------------------------------------------------|
| publicCredentialFields    | Fields that are considered "public" information and ok to display in cleartext for detail screens |
| privateCredentialFields   | Fields that are private information that should be stored as a secret                             |
| optionalCredentialFields  | Fields that are related to the credential, but are optional for the user to fill out              |
| passwordFields            | Fields that should be displayed as type="password" bullets instead of cleartext                   |
| defaults                  | Default values to set which the user may override                                                 |

Each has a value that is a comma-separated list of field names.  `defaults` are comma-separated, then colon-separated for key and value (e.g. `foo:bar,baz:42`).  The annotations become information in API schemas, which the generic UI support uses to show better information.

The standard drivers included in Rancher and their options are defined [here](https://github.com/rancher/rancher/blob/release/v2.6/pkg/data/management/machinedriver_data.go).

## Cloud Credential

Cloud Credentials store the username & password, or other similar information, needed to talk to a particular provider.  There is typically a 1-to-1 mapping of cloud credentials to drivers.  If one provider (e.g. Amazon) has both a *Machine* driver for RKE (using EC2) and a *Cluster* driver for Kontainer Engine (using EKS) then you can and should use a single shared type of credential (e.g. `aws`) for both.

The cloud credential component lives in the top-level `cloud_credential` directory in the repo.  The file should be named the same as the driver, in all lowercase (e.g. `cloud_credential/digitalocean.vue`).

If there is a reason to rename it or map multiple drivers to the same credential, configure that in the [plugins store](`../../../../store/plugins.js`).  There is also other info in there about how guesses are taken on what each field is for and how it should be displayed.  These can be customized for your driver by importing and calling `configureCredential()` and `mapDriver()`.

Create a component which displays each field that is relevant to authentication and lets the user configure them.  Only the actual auth fields themselves, the rest of configuring the name, description, save buttons, etc is handled outside of the credential component.

Your component should emit a `validationChanged` event every time a value changes.  It should also (but doesn't _have to_ implement a `test()` method.  This may be asynchronous, and should make an API call or similar to see if the provided credentials work.  Return `true` if they're ok and `false` otherwise.  When provided, this is called before saving and the user won't be able to save until their input causes you return `true`.

## Machine Config

Similar to the Cloud Credential component, the Machine Config component should display just controls for the fields on the driver that are relevant to the configuration of the machine to be created.  The machine pool name, saving, etc is handled outside of your component.  You probably want to use `fetch()` to load some info from the provider's API (e.g. list of regions or instance types).

It should live in the top-level `machine_config` directory, again named the same as the driver and lowercase (e.g. `machine_config/digitalocean.vue`).

The selected cloud credential ID is available as a `credentialId` prop.  You will always know that ID, and can use it to make API calls (see [#api-calls] below), but **must not** rely on being able to actually retrieve the cloud credential model corresponding to it.  Users with lesser permissions may be able to edit a cluster, but not have permission to see the credential being used to manage it.

## Model

Each cluster has one or more Machine Templates, which specify to create a particular number of machines using a specified Machine Config + Cloud Credential.  Basic information about the template is shown later on detail screens, such as the machine size and location.  This is done by providing a model class for your driver's template and overriding methods.

Your model should be called `models/rke-machine.cattle.io.[your driver in lowercase]template.js` (corresponding to the schema that shows up once the driver is installed).  It should extend the generic MachineTemplate and override methods as appropriate:

```javascript
import MachineTemplate from './rke-machine.cattle.io.machinetemplate';

export default class MyDriverMachineTemplate extends MachineTemplate {
  get provider() {
    return 'mydriver';
  }

  get providerLocation() {
    return this.spec.template.spec.zone;
  }

  get providerSize() {
    return this.spec.template.spec.instanceType;
  }
}
```

## API Calls

Rancher includes a [proxy](https://github.com/rancher/rancher/blob/release/v2.6/pkg/httpproxy/proxy.go) that can be used to make requests to third-party domains (like a cloud provider's API) without requiring that the other end supports CORS or other browser shenanigans.  Send requests to `/meta/proxy/example.com/whatever/path/you/want` and the request will be made from the Rancher server and proxied back to you.

TLS and port 443 are assumed.  Add a port after the hostname to change the port (`example.com:1234`).  For plain HTTP, first stop and consider the chain of life decisions which have led you to this point. Then if you still think you need that, use `/meta/proxy/http:/example.com:1234` (note one slash after `http:`, not two).  The hostname must be included in the whitelist defined in global settings, or in the configuration for an active node driver.  If if isn't your request will be denied.  (This prevents a malicious (non-admin) user from abusing the Rancher server as an arbitrary HTTP proxy or reach internal IPs/names that the server can reach directly but the user can't from the outside.)

The rest of the path and query string are sent to the target host as you'd expect.

Normal headers are copied from your request and sent to the target.  There are some exceptions for sensitive fields like the user's rancher cookies or saved basic auth creds which will not be copied.  If you send an `X-Api-Cookie-Header`, its value will be sent as the normal `Cookie` to the target.  If you send `X-API-Auth-Header`, that will be sent out as the normal `Authorization`.

But normally you want to make a request using a Cloud Credential as the authorization, without knowing what the secret values in that credential are.  You ask for this by sending an `X-Api-CattleAuth-Header` header.  The value of the header specifies what credential Id to use, and a [signer](https://github.com/rancher/rancher/blob/release/v2.6/pkg/httpproxy/sign.go) which describes how that credential should be injected into the request.  Common options include `awsv4` (Amazon's complicated HMAC signatures), `bearer`, `basic`, and `digest`.  For example if you send `X-Api-CattleAuth-Header: Basic credId=someCredentialId usernameField=user passwordField=pass`, Rancher will retrieve the credential with id `someCredentialId`, read the values of the `user` and `pass` fields from it and add the header `Authorization: Basic <base64(user + ":" + pass)>` to the proxied request for you.

## Store

If you have several different API calls to make or expensive information that can be cached after it's retrieved once, consider making a `store` with getters and actions to handle making your API calls and managing the caching.  Most of the standard built-in drivers have these.

For more complicated providers (e.g. AWS) you can also consider importing their Javascript SDK and using their client to make calls.  But unless there is an extension point to manipulate the request before they send it, you'll probably have to monkey patch their client to get the `X-Api-CattleAuth-Header` injected and the request sent through the proxy instead of direct to them.  The SDK should also be dynamically `import('…')`ed as needed at runtime so it's not loaded all the time.  Regular `import … as …;` at the top of the file will become part of the basic app bundle js that's always loaded and has to be downloaded before the page can render.  `store/aws.js` has examples of all of this.
