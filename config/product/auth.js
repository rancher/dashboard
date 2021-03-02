import { DSL } from '@/store/type-map';
// import { STATE, NAME as NAME_COL, AGE } from '@/config/table-headers';
import { MANAGEMENT, NORMAN, RBAC } from '@/config/types';
import { GROUP_NAME, GROUP_ROLE_NAME } from '@/config/table-headers';

export const NAME = 'auth';

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
    ifHaveType:          MANAGEMENT.USER,
    inStore:             'management',
    icon:                'user',
    removable:           false,
    weight:              50,
    public:              false, // Hide from regular view during development
    showClusterSwitcher: false,
  });

  virtualType({
    label:       'Auth Provider',
    icon:        'lock',
    namespaced:  false,
    name:        'config',
    weight:      100,
    route:       { name: 'c-cluster-auth-config' },
    ifHaveType: MANAGEMENT.AUTH_CONFIG
  });

  spoofedType({
    label:             store.getters['type-map/labelFor']({ id: NORMAN.SPOOFED.GROUP_PRINCIPAL }, 2),
    type:              NORMAN.SPOOFED.GROUP_PRINCIPAL,
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
      const canFetchGlobalRoles = !!store.getters[`management/schemaFor`](RBAC.GLOBAL_ROLE);
      const canFetchGlobalRoleBindings = !!store.getters[`management/schemaFor`](RBAC.GLOBAL_ROLE_BINDING);

      if (!canFetchGlobalRoles || !canFetchGlobalRoleBindings) {
        return [];
      }

      // Groups are a list of principals filtered via those that have group roles bound to them
      const principals = await store.dispatch('rancher/findAll', {
        type: NORMAN.PRINCIPAL,
        opt:  { url: '/v3/principals' }
      });

      const globalRoleBindings = await store.dispatch('management/findAll', {
        type: RBAC.GLOBAL_ROLE_BINDING,
        opt:  { force: true }
      });

      // Up front fetch all global roles, instead of individually when needed (results in many duplicated requests)
      await store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE });

      return principals
        .filter(principal => principal.principalType === 'group' &&
          !!globalRoleBindings.find(globalRoleBinding => globalRoleBinding.groupPrincipalName === principal.id)
        )
        .map(principal => ({
          ...principal,
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

  weightType(NORMAN.SPOOFED.GROUP_PRINCIPAL, -1, true);
  weightType(MANAGEMENT.USER, 100);
  configureType(MANAGEMENT.USER, { showListMasthead: false });

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

  basicType([
    'config',
    MANAGEMENT.USER,
    NORMAN.SPOOFED.GROUP_PRINCIPAL
  ]);

  headers(NORMAN.SPOOFED.GROUP_PRINCIPAL, [
    GROUP_NAME,
    GROUP_ROLE_NAME
  ]);
}
