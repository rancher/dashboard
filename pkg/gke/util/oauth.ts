/**
 * in GKE nodepool config, oauthscopes are an array of URLS
 * format is GOOGLE_AUTH_URL/GCP_API_KEY.SCOPE_VALUE eg https://www.googleapis.com/auth/compute.readonly
 * in the nodepool form, this is represented as an object {SCOPE_KEY: SCOPE_VALUE}
*/

/**
 * keys of this object are each a gcp api to which access may be granted
 * values are the labeledselect options for that key
 */
export const GKEOauthScopeFormOptions = {
  userinfo: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'userinfo.email',
    }
  ],

  compute: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.readOnly',
      value:    'compute.readonly',
    },
    {
      labelKey: 'gke.authScopes.options.readWrite',
      value:    'compute',
    },
  ],

  devstorage: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.readOnly',
      value:    'devstorage.read_only',
    },
    {
      labelKey: 'gke.authScopes.options.writeOnly',
      value:    'devstorage.write_only',
    },
    {
      labelKey: 'gke.authScopes.options.readWrite',
      value:    'devstorage',
    },
    {
      labelKey: 'gke.authScopes.options.full',
      value:    'devstorage.full_control',
    },
  ],

  taskqueue: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'taskqueue',
    }
  ],

  bigquery: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'bigquery',
    }
  ],

  sqlservice: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'sqlservice.admin',
    }
  ],

  clouddatastore: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'clouddatastore',
    }
  ],

  logging: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.writeOnly',
      value:    'logging.write',
    },
    {
      labelKey: 'gke.authScopes.options.readOnly',
      value:    'logging.read',
    },
    {
      labelKey: 'gke.authScopes.options.full',
      value:    'logging.admin',
    },
  ],

  monitoring: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.writeOnly',
      value:    'monitoring.write',
    },
    {
      labelKey: 'gke.authScopes.options.readOnly',
      value:    'monitoring.read',
    },
    {
      labelKey: 'gke.authScopes.options.full',
      value:    'monitoring',
    },
  ],

  'cloud-platform': [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'cloud-platform',
    }
  ],

  'bigtable.data': [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.readOnly',
      value:    'bigtable.data.readonly',
    },
    {
      labelKey: 'gke.authScopes.options.readWrite',
      value:    'bigtable.data',
    },
  ],

  'bigtable.admin': [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'clusterNew.googlegke.tablesOnly',
      value:    'bigtable.admin.table',
    },
    {
      labelKey: 'gke.authScopes.options.full',
      value:    'bigtable.admin',
    },
  ],

  pubsub: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'pubsub',
    }
  ],

  servicecontrol: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'servicecontrol',
    }
  ],

  'service.management': [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.readOnly',
      value:    'service.management.readonly',
    },
    {
      labelKey: 'gke.authScopes.options.readWrite',
      value:    'service.management',
    },
  ],

  trace: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.readOnly',
      value:    'trace.readonly',
    },
    {
      labelKey: 'gke.authScopes.options.writeOnly',
      value:    'trace.append',
    },
  ],

  source: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.readOnly',
      value:    'source.read_only',
    },
    {
      labelKey: 'gke.authScopes.options.readWrite',
      value:    'source.read_write',
    },
    {
      labelKey: 'gke.authScopes.options.full',
      value:    'source.full_control',
    },
  ],

  cloud_debugger: [
    {
      labelKey: 'gke.authScopes.options.none',
      value:    'none'
    },
    {
      labelKey: 'gke.authScopes.options.enabled',
      value:    'cloud_debugger',
    }
  ],
};

/**
 * THe ui shows different oauth 'modes' for the user to choose between then fills out the nodepool.config.oauthscopes accordingly
 * default = defaultAuthScopes
 * full = [googleFullAuthUrl]
 * custom = show the user a big ol form
 */
export const GKEOauthScopeOptions = {
  DEFAULT: 'default',
  FULL:    'full',
  CUSTOM:  'custom'
};

export const googleAuthURLPrefix = 'https://www.googleapis.com/auth/' ;

export const googleFullAuthUrl = 'https://www.googleapis.com/auth/cloud-platform' ;

const defaultAuthScopes: string[] = [
  'devstorage.read_only',
  'logging.write',
  'monitoring',
  'servicecontrol',
  'service.management.readonly',
  'trace.append'
];

export function getGoogleAuthDefaultURLs(): string[] {
  return defaultAuthScopes.map((a) => `${ googleAuthURLPrefix }${ a }`);
}

/**
 * Find a given auth scope in array of oauthscopes and parse its value.
 * If oauthScopes does not contain a string matching the auth scope key, assume the value is 'none'/no access
 * @param oauthScopes
 * @param key
 * @param defaultValue
 * @returns
 */
export function getValueFromGKEOauthScopes(oauthScopes: string[], key: string): string {
  const filteredValues = oauthScopes
    .filter((scope) => scope.indexOf(key) !== -1)
    .map((scope) => {
      return scope
        .replace(googleAuthURLPrefix, '')
        .replace(key, '').split('.');
    })
    .filter((splitScopes) => splitScopes.length <= 2);

  if (filteredValues.length !== 1) {
    return 'none';
  }

  return filteredValues[0].length === 1 ? key : `${ key }.${ filteredValues[0][1] }`;
}

/**
 */

/**
 * Add a new auth scope to oauthscopes and remove any existing auth urls for that scope key
 * (ie if adding compute.readOnly, make sure there is no compute.readWrite auth url in oauthscopes)
 * @param oauthScopes gkeconfig.nodepools[].config.oauthscopes
 * @param scopeKey gcp api being scoped - will be one of the keys in GKEOauthScopeFormOptions
 * @param scope new scope value to apply - will be one of the values in GKEOauthScopeFormOptions[scopeKey]
 * @returns a new oauthscopes array
 */
export function addGKEAuthScope(oauthScopes: string[], scopeKey: keyof typeof GKEOauthScopeFormOptions, scope: string): string[] {
  const scopeKeyURLOptions = GKEOauthScopeFormOptions[scopeKey].reduce((all: string[], { value }) => {
    if (value !== 'none') {
      const url = `${ googleAuthURLPrefix }${ value }`;

      all.push(url);
    }

    return all;
  }, []);

  const withoutThisScope = oauthScopes.filter((url) => !scopeKeyURLOptions.includes(url));

  if (scope === 'none') {
    return withoutThisScope;
  } else {
    const newScopeUrl = `${ googleAuthURLPrefix }${ scope }`;

    return [...withoutThisScope, newScopeUrl];
  }
}
