# Auth Providers

## Github

### Developer Set up
Follow the in-dashboard instructions when configuring a Github auth provider.

### Multiple GitHub auth configs
The auth system supports multiple GitHub auth URLs and using the appropriate one based on the Host header that a request comes in on.  Configuring this is not exposed in the regular UI, but is particularly useful for development against a server that already has GitHub setup.

In `management.cattle.io.authconfig`, edit the `github` entry.  Add a `hostnameToClientId` map of Host header value -> GitHub client ID:

```yaml
hostnameToClientId:
  "localhost:8005": <your GitHub Client ID for localhost:8005>
```

In the `secret`, namespace `cattle-global-data`, edit `githubconfig-clientsecret`.  Add GitHub client ID -> base64-encoded client secret to the `data` section:

```yaml
data:
  clientsecret: <the normal client secret already configured>
  <your client id>: <your base64-encoded client secret for localhost:8005>
 ```

## Keycloak

### Developer Set Up (SAML)
Use the steps below to set up a Keycloak instance for dev environments and configure an Auth Provider for it.

1. Bring up a local Keycloak instance in docker using the instructions at [here](https://www.keycloak.org/getting-started/getting-started-docker).
   
   > Ensure that the admin user has a first name, last name and email. These fields are referenced in the Keycloak client's mappers which are then referenced in the Rancher's auth provider config.

   > Double check the client has the correct checkboxes set, specifically the Mappers `group` entry.
1. Using either the Ember or Vue UI set up the Keycloak auth provider by follow the instructions at [here](https://ranchermanager.docs.rancher.com/v2.8/how-to-guides/new-user-guides/authentication-permissions-and-global-configuration/authentication-config/configure-keycloak-saml)
   
   | Field              | Value                                                                                                                                                                                                                                                                                        |
   | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Display Name Field | givenName                                                                                                                                                                                                                                                                                    |
   | User Name Field    | email                                                                                                                                                                                                                                                                                        |
   | UID Field          | email                                                                                                                                                                                                                                                                                        |
   | Groups Field       | member                                                                                                                                                                                                                                                                                       |
   | Entity ID Field    | Depending on Rancher API Url. For instance when running Dashboard locally `https://192.168.86.26:8005/v1-saml/keycloak/saml/metadata`                                                                                                                                                        |
   | Rancher API Host   | Depending on Rancher API Url. For instance when running Dashboard locally `https://192.168.86.26:8005/`                                                                                                                                                                                      |
   | Private Key        | For key and cert files, export the Client in the Keycloak UI via the `Clients` list page and extract & wrap the `saml.signing.certificate` and `saml.signing.private.key` as cert files (see [step 5](https://gist.github.com/PhilipSchmid/506b33cd74ddef4064d30fba50635c5b) for more info). |
   | Certificate        | See Private Key section above                                                                                                                                                                                                                                                                |
   | Metadata           | For the SAML Metadata, download as per Rancher docs. Be sure to follow the `NOTE` instructions regarding `EntitiesDescriptor` and `EntityDescriptor`. For a better set of instructions see [step 6](https://gist.github.com/PhilipSchmid/506b33cd74ddef4064d30fba50635c5b)                   |

### Developer Set Up (OIDC)

1. In Vue UI set up the Keycloak OIDC provider with the following values

   | Field                  | Value                                                                        |
   | ---------------------- | ---------------------------------------------------------------------------- |
   | Client ID              | Find via the keycloak console                                                |
   | Client Secret          | Find via the keycloak console (client's credentials tab)                     |
   | Private Key (optional) |                                                                              |
   | Certificate (optional) |                                                                              |
   | Keycloak URL           | URL of keycloak instance (no path)                                           |
   | Keycloak Realm         | Find via the keycloak console (above menu on left or in path after /realms/) |

> The user used when enabling the provider must be an Admin or in a group

