/**
 * Rancher only creates an auth config once an admin adds one, so the auth
 * provider specs stand these in for the configs they work against.
 *
 * Stubbing the config, rather than letting the form create it, keeps a spec from
 * leaving a config behind on the server. One left behind would take the name a
 * retry is offered, and every request the retry intercepts would go to another URL.
 */
export interface AuthConfigStub {
  /** The config's name, e.g. `okta`. A provider's first config is named after it. */
  name: string;
  /** The Norman type, e.g. `oktaConfig`. */
  normanType: string;
  /** The Norman collection the config's links point at, e.g. `oktaConfigs`. */
  collection: string;
  /**
   * The actions the server offers on a config of this type. The save path picks
   * its flow from them - `testAndEnable` means SAML - so they have to match.
   */
  actions: string[];
}

const normanConfig = ({
  name, normanType, collection, actions
}: AuthConfigStub, fields: Record<string, any> = {}) => {
  const self = `/v3/${ collection }/${ name }`;

  return {
    id:                  name,
    name,
    type:                normanType,
    baseType:            'authConfig',
    enabled:             false,
    accessMode:          'unrestricted',
    allowedPrincipalIds: [],
    annotations:         {},
    links:               { self, update: self },
    actions:             Object.fromEntries(actions.map((action) => [action, `${ self }?action=${ action }`])),
    ...fields,
  };
};

const steveConfig = ({ name, normanType }: AuthConfigStub, enabled: boolean) => {
  const self = `/v1/management.cattle.io.authconfigs/${ name }`;

  return {
    id:       name,
    type:     'management.cattle.io.authconfig',
    _type:    normanType,
    enabled,
    metadata: { name },
    links:    {
      self, update: self, view: `/apis/management.cattle.io/v3/authconfigs/${ name }`
    },
  };
};

/**
 * The save path looks the config up in the Norman list, which the server would
 * not otherwise have it in.
 */
const listed = (config: Record<string, any>) => cy.intercept('GET', '/v3/authConfigs*', (req) => {
  req.continue((res) => {
    const data = (res.body?.data || []).filter((c: any) => c.id !== config.id);

    res.body = { ...res.body, data: [...data, config] };
  });
});

/**
 * Answers the requests that add a config: the Kubernetes create, then the
 * Norman read the form picks the new config up with.
 */
export function interceptAuthConfigCreate(stub: AuthConfigStub): Cypress.Chainable<null> {
  const config = normanConfig(stub);

  listed(config);
  cy.intercept('POST', '/k8s/clusters/local/apis/management.cattle.io/v3/authconfigs', {
    statusCode: 201,
    body:       {
      apiVersion: 'management.cattle.io/v3', kind: 'AuthConfig', metadata: { name: stub.name }, type: stub.normanType, enabled: false
    },
  }).as('createAuthConfig');

  return cy.intercept('GET', `/v3/authconfig/${ stub.name }`, { statusCode: 200, body: config }).as('createdAuthConfig');
}

/**
 * Serves a config that is already enabled, with `fields` set on its Norman side,
 * for the edit page to open.
 */
export function interceptEnabledAuthConfig(stub: AuthConfigStub, fields: Record<string, any>): Cypress.Chainable<null> {
  const config = normanConfig(stub, { enabled: true, ...fields });

  listed(config);
  cy.intercept('GET', `/v1/management.cattle.io.authconfigs/${ stub.name }*`, { statusCode: 200, body: steveConfig(stub, true) });

  return cy.intercept('GET', `/v3/authconfig/${ stub.name }`, { statusCode: 200, body: config }).as('authConfig');
}
