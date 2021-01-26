import { DSL } from '@/store/type-map';
// import { STATE, NAME as NAME_COL, AGE } from '@/config/table-headers';
import { MANAGEMENT } from '@/config/types';

export const NAME = 'auth';

export function init(store) {
  const {
    product,
    basicType,
    // weightType,
    configureType,
    componentForType,
    // headers,
    // mapType,
    virtualType,
  } = DSL(store, NAME);

  product({
    ifHaveType:          MANAGEMENT.USER,
    inStore:             'management',
    icon:                'user',
    removable:           false,
    weight:              -1,
    showClusterSwitcher: false,
  });

  virtualType({
    label:       'Auth Provider',
    icon:        'lock',
    namespaced:  false,
    name:        'config',
    weight:      100,
    route:       { name: 'c-cluster-auth-config' },
  });

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

  basicType([
    'config',
    MANAGEMENT.USER,
    // MANAGEMENT.GROUP,
  ]);
}
