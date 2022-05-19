import { DSL } from '@shell/store/type-map';
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import { uniq } from '@shell/utils/array';
import {
  GROUP_NAME, GROUP_ROLE_NAME,
  RBAC_BUILTIN, RBAC_DEFAULT, STATE, NAME as HEADER_NAME, AGE, SIMPLE_NAME
} from '@shell/config/table-headers';
import { MULTI_CLUSTER } from '@shell/store/features';

export const NAME = 'auth';

const USERS_VIRTUAL_TYPE = 'users';
const ROLES_VIRTUAL_TYPE = 'roles';

export function init(store) {
  const {
    product,
    basicType,
    weightType,
    configureType,
    componentForType,
    headers,
    mapType,
    spoofedType,
    virtualType,
  } = DSL(store, NAME);

  product({
    ifHaveType:          new RegExp(`${ MANAGEMENT.USER }|${ MANAGEMENT.AUTH_CONFIG }`, 'i'),
    ifHaveVerb:          'PUT',
    ifFeature:           MULTI_CLUSTER,
    inStore:             'management',
    icon:                'user',
    removable:           false,
    showClusterSwitcher: false,
    category:            'configuration',
  });

  virtualType({
    labelKey:    'auth.config.label',
    icon:        'lock',
    namespaced:  false,
    name:        'config',
    weight:      -1,
    route:       { name: 'c-cluster-auth-config' },
    ifHaveType: MANAGEMENT.AUTH_CONFIG
  });

  virtualType({
    label:       store.getters['type-map/labelFor']({ id: MANAGEMENT.USER }, 2),
    name:           USERS_VIRTUAL_TYPE,
    namespaced:     false,
    weight:         102,
    icon:           'user',
    route:          {
      name:   'c-cluster-product-resource',
      params: {
        cluster:  'local',
        product:  NAME,
        resource: MANAGEMENT.USER,
      }
    }
  });
  configureType(MANAGEMENT.USER, { showListMasthead: false });

  spoofedType({
    label:             store.getters['type-map/labelFor']({ id: NORMAN.SPOOFED.GROUP_PRINCIPAL }, 2),
    type:              NORMAN.SPOOFED.GROUP_PRINCIPAL,
    ifHaveType:        MANAGEMENT.GLOBAL_ROLE_BINDING,
    collectionMethods: [],
    schemas:           [
      {
        id:                NORMAN.SPOOFED.GROUP_PRINCIPAL,
        type:              'schema',
        collectionMethods: [],
        resourceFields:    {},
      }
    ],
    getInstances: async() => {
      // Determine if the user can get fetch global roles & global role bindings. If not there's not much point in showing the table
      const canFetchGlobalRoles = !!store.getters[`management/canList`](MANAGEMENT.GLOBAL_ROLE);
      const canFetchGlobalRoleBindings = !!store.getters[`management/canList`](MANAGEMENT.GLOBAL_ROLE_BINDING);

      if (!canFetchGlobalRoles || !canFetchGlobalRoleBindings) {
        return [];
      }

      // Ensure we upfront load principals (saves making individual requests later)
      await store.dispatch('rancher/findAll', {
        type: NORMAN.PRINCIPAL,
        opt:  { url: '/v3/principals' }
      });

      // getInstances should return a list of principals that have global bindings.
      // It would be easier to just filter principals from above by those with bindings...
      // .. however the principals list from above is NOT complete and misses some that have bindings (seen when using AD)
      // So flip the logic and fetch any principal that's missing from the principal list

      const globalRoleBindings = await store.dispatch('management/findAll', {
        type: MANAGEMENT.GLOBAL_ROLE_BINDING,
        opt:  { force: true }
      });

      const uniquePrincipalIds = uniq(globalRoleBindings
        .filter(grb => !!grb.groupPrincipalName)
        .map(grb => grb.groupPrincipalName)
      );

      const allPrincipalsP = uniquePrincipalIds
        .map(async(pId) => {
          // Guard against principals that aren't retrievable (bindings to principals from previous auth providers)
          try {
            return await store.dispatch('rancher/find', {
              type: NORMAN.PRINCIPAL,
              opt:  { url: `/v3/principals/${ encodeURIComponent(pId) }` },
              id:   pId
            });
          } catch (e) {
            console.warn(`Failed to fetch Principal with id: '${ pId }'`, e); // eslint-disable-line no-console
          }
        });

      const allPrincipals = await Promise.all(allPrincipalsP);

      return allPrincipals
        .filter(p => !!p)
        .map(p => ({
          ...p,
          type: NORMAN.SPOOFED.GROUP_PRINCIPAL
        }));
    }
  });
  configureType(NORMAN.SPOOFED.GROUP_PRINCIPAL, {
    isCreatable:      false,
    showAge:          false,
    showState:        false,
    isRemovable:      false,
    showListMasthead: false,
  });
  // Use labelFor... so lookup succeeds with .'s in path.... and end result is 'trimmed' as per other entries
  mapType(NORMAN.SPOOFED.GROUP_PRINCIPAL, store.getters['type-map/labelFor']({ id: NORMAN.SPOOFED.GROUP_PRINCIPAL }, 2));
  weightType(NORMAN.SPOOFED.GROUP_PRINCIPAL, 101, true);

  virtualType({
    label:       store.getters['i18n/t']('rbac.roletemplate.label'),
    icon:        'user',
    namespaced:  false,
    name:        ROLES_VIRTUAL_TYPE,
    weight:      101,
    route:       { name: 'c-cluster-auth-roles' },
    // There are two resource types shown on this page, MANAGEMENT.GLOBAL_ROLE and MANAGEMENT.ROLE_TEMPLATE
    // If there user can't see ROLE_TEMPLATE, they definitely can't see GLOBAL_ROLE
    ifHaveType:  MANAGEMENT.ROLE_TEMPLATE
  });

  configureType(MANAGEMENT.AUTH_CONFIG, {
    isCreatable: false,
    isRemovable: false,
    showAge:     false,
    location:    null,
  });

  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/github`, 'auth/github');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/openldap`, 'auth/ldap/index');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/freeipa`, 'auth/ldap/index');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/activedirectory`, 'auth/ldap/index');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/ping`, 'auth/saml');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/shibboleth`, 'auth/saml');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/okta`, 'auth/saml');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/keycloak`, 'auth/saml');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/adfs`, 'auth/saml');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/googleoauth`, 'auth/googleoauth');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/azuread`, 'auth/azuread');
  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/keycloakoidc`, 'auth/oidc');

  basicType([
    'config',
    USERS_VIRTUAL_TYPE,
    NORMAN.SPOOFED.GROUP_PRINCIPAL,
    ROLES_VIRTUAL_TYPE
  ]);

  headers(NORMAN.SPOOFED.GROUP_PRINCIPAL, [
    GROUP_NAME,
    GROUP_ROLE_NAME
  ]);

  // A lot of the built in roles have nicer names returned by nameDisplay. In both tables we want to show both nicer and base names
  const DISPLAY_NAME = {
    ...HEADER_NAME,
    name:          'displayName',
    labelKey: 'tableHeaders.nameDisplay',
  };

  headers(MANAGEMENT.GLOBAL_ROLE, [
    STATE,
    DISPLAY_NAME,
    SIMPLE_NAME,
    RBAC_BUILTIN,
    {
      ...RBAC_DEFAULT,
      labelKey: 'tableHeaders.authRoles.globalDefault',
    },
    AGE
  ]);

  headers(MANAGEMENT.ROLE_TEMPLATE, [
    STATE,
    DISPLAY_NAME,
    SIMPLE_NAME,
    RBAC_BUILTIN,
    RBAC_DEFAULT,
    AGE
  ]);
}
