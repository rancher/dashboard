# Machine Drivers

A machine driver consists of:
  - The actual driver run inside the server container.  This can be built-in to `rancher-machine` or loaded as an external binary.
  - A component to create & edit the `cloud-credential` for the provider, which stores the user's auth information to talk to the provider API.
  - A component to create & edit the `machine-config`, which describes the size, location, and other options for a particular machine to be deployed to the provider.
  - An optional `model` to override properties of a generic `machine-template` object with details specific to this provider.
  - An optional `store` to facilitate communication with the provider's API and caching of information retrieved from it.

## Driver binary

To tell Rancher about a new driver, go to Cluster Management -> Providers -> Node Drivers -> Add Node Driver.  Set the URL the binary should be downloaded from.  If the UI will need to communicate with an API to show options (e.g getting data from `api.mycloudprovider.com`), add it to the list of Whitelist Domains.  Click Create to save.  The driver is downloaded and loaded and becomes available in the UI using all the generic driver support.  This just lists all the fields that the driver says it has and makes some guesses about likely sounding names.  The user ultimately has to figure out which ones are required or important and set those.  To improve on that, continue reading.

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

## Cloud Credential

Cloud Credentials store the username & password, or other similar information, needed to talk to a particular provider.  There is typically a 1-to-1 mapping of cloud credentials to drivers.  If one provider (e.g. Amazon) has both a *Machine* driver for RKE (using EC2) and a *Hosted provider* (using EKS) then you can and should use a single shared type of credential (e.g. `aws`) for both.

The cloud credential component lives in the top-level `cloud-credential` directory in the repo.  The file should be named the same as the driver, in all lowercase (e.g. `cloud-credential/digitalocean.vue`).

If there is a reason to rename it or map multiple drivers to the same credential, configure that in `shell/store/plugins.js`.  There is also other info in there about how guesses are taken on what each field is for and how it should be displayed.  These can be customized for your driver by importing and calling `configureCredential()` from `@shell/store/plugins` and dispatching the `plugins/mapDriver` store action.

Create a component which displays each field that is relevant to authentication and lets the user configure them.  Only the actual auth fields themselves, the rest of configuring the name, description, save buttons, etc is handled outside of the credential component.

Your component should emit a `validationChanged` event every time a value changes.  It should also (but doesn't _have to_ implement a `test()` method.  This may be asynchronous, and should make an API call or similar to see if the provided credentials work.  Return `true` if they're ok and `false` otherwise.  When provided, this is called before saving and the user won't be able to save until their input causes you return `true`.

## Machine Config

Similar to the Cloud Credential component, the Machine Config component should display just controls for the fields on the driver that are relevant to the configuration of the machine to be created.  The machine pool name, saving, etc is handled outside of your component.  You probably want to use `fetch()` to load some info from the provider's API (e.g. list of regions or instance types).

It should live in the top-level `machine-config` directory, again named the same as the driver and lowercase (e.g. `machine-config/digitalocean.vue`).

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

Rancher routes UI requests to third-party domains through its server-side `/meta/proxy` endpoint. Use the **`shell.proxy` API** (`this.$shell.proxy`) to make these requests — it handles URL construction, credential-based auth header signing, and de-pagination for you.

### Allow-list

API calls can only be made to hostnames registered on the proxy allow-list. The `shell.proxy` API provides two ways to check whether a domain is registered:

| Method | How it works | Performance |
|---|---|---|
| `hasProxyEndpoint(name)` | Fetches a single CR by name | preferred |
| `isDomainAllowed(domain)` | Fetches **all** `ProxyEndpoint` CRs and scans every route entry for an exact match | May be expensive — use wisely |

It is generally preferable to create your own `ProxyEndpoint` CR with a stable, well-known name and use `hasProxyEndpoint` to check for it. Reserve `isDomainAllowed` for cases where the CR name is not under your control.

```ts
const CR_NAME = 'my-driver-endpoints';


const exists = await this.$shell.proxy.hasProxyEndpoint(CR_NAME);

if (!exists) {
  await this.$shell.proxy.allowDomains(['api.example.com'], CR_NAME);
}
```

### GET with a Cloud Credential

```ts
const result = await this.$shell.proxy.request({
  url:            new URL('https://api.example.com/v1/instances'),
  authentication: {
    id:            myCloudCredentialId,
    authSigner:    'bearer',
    passwordField: 'token',
  },
});
```

### GET with a plain token

```ts
const result = await this.$shell.proxy.request({
  url:            new URL('https://api.example.com/v1/images'),
  authentication: { token: myApiToken },
});
```

### De-pagination

Use `createDepaginator` (imported from `@shell/apis/shell/proxy`) to follow paginated responses automatically:

```ts
import { createDepaginator } from '@shell/apis/shell/proxy';

const baseUrl = new URL('https://api.example.com/v1/instances');
baseUrl.searchParams.set('per_page', '200');

const baseOptions = {
  url:            baseUrl,
  authentication: {
    id:            myCloudCredentialId,
    authSigner:    'bearer',
    passwordField: 'token',
  },
};

const all = await this.$shell.proxy.request({
  ...baseOptions,
  postProcess: createDepaginator(
    this.$shell.proxy,
    baseOptions,
    { nextUrlPath: 'links.pages.next', mergeKey: 'instances' },
  ),
});
```

### AWS SDK integration

For providers that use the AWS JavaScript SDK (e.g. EKS, EC2), the SDK's `requestHandler` must route through the proxy. `store/aws.js` implements a custom `Handler` class that calls `this.$shell.proxy.prepareRequest()` to obtain the proxy URL and auth headers and then delegates to the SDK's `FetchHttpHandler`. Use that as a pattern for any SDK-based provider.

### URL format reference

The proxy accepts paths of the form `/meta/proxy/<host>/<path>`. `shell.proxy` constructs this automatically. For reference:

- TLS on port 443 is the default.
- Different port: `example.com:1234/path`.
- Plain HTTP *(avoid where possible)*: `http:/example.com:1234/path` (one slash after `http:`).

## Store

If you have several different API calls to make or expensive information that can be cached after it's retrieved once, consider making a `store` with getters and actions to handle making your API calls and managing the caching.  Most of the standard built-in drivers have these.

For more complicated providers (e.g. AWS) you can also consider importing their Javascript SDK and using their client to make calls.  But unless there is an extension point to manipulate the request before they send it, you'll probably have to monkey patch their client to get the `X-Api-CattleAuth-Header` injected and the request sent through the proxy instead of direct to them.  The SDK should also be dynamically `import('…')`ed as needed at runtime so it's not loaded all the time.  Regular `import … as …;` at the top of the file will become part of the basic app bundle js that's always loaded and has to be downloaded before the page can render.  `store/aws.js` has examples of all of this.
