import { CYPRESS_SAFE_RESOURCE_REVISION } from '../blueprint.utils';

// GET /v3/users - small set of users data
const usersGetResponseSmallSet = {
  type:        'collection',
  links:       { self: 'https://yonasb29h3.qa.rancher.space/v3/users' },
  createTypes: { user: 'https://yonasb29h3.qa.rancher.space/v3/users' },
  actions:     {
    changepassword:            'https://yonasb29h3.qa.rancher.space/v3/users?action=changepassword',
    refreshauthprovideraccess: 'https://yonasb29h3.qa.rancher.space/v3/users?action=refreshauthprovideraccess'
  },
  pagination: {
    limit: 1000,
    total: 2
  },
  sort: {
    order:   'asc',
    reverse: 'https://yonasb29h3.qa.rancher.space/v3/users?order=desc',
    links:   {
      description:          'https://yonasb29h3.qa.rancher.space/v3/users?sort=description',
      name:                 'https://yonasb29h3.qa.rancher.space/v3/users?sort=name',
      password:             'https://yonasb29h3.qa.rancher.space/v3/users?sort=password',
      state:                'https://yonasb29h3.qa.rancher.space/v3/users?sort=state',
      transitioning:        'https://yonasb29h3.qa.rancher.space/v3/users?sort=transitioning',
      transitioningMessage: 'https://yonasb29h3.qa.rancher.space/v3/users?sort=transitioningMessage',
      username:             'https://yonasb29h3.qa.rancher.space/v3/users?sort=username',
      uuid:                 'https://yonasb29h3.qa.rancher.space/v3/users?sort=uuid'
    }
  },
  filters: {
    created:              null,
    creatorId:            null,
    description:          null,
    enabled:              null,
    id:                   null,
    me:                   null,
    mustChangePassword:   null,
    name:                 null,
    password:             null,
    removed:              null,
    state:                null,
    transitioning:        null,
    transitioningMessage: null,
    username:             null,
    uuid:                 null
  },
  resourceType: 'user',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION, // The UI will use this point in history to start watching for changes from. If it's too low (than the global system revision) we will spam with requests
  data:         [
    {
      actions: {
        refreshauthprovideraccess: 'https://yonasb29h3.qa.rancher.space/v3/users/u-mvhtt?action=refreshauthprovideraccess',
        setpassword:               'https://yonasb29h3.qa.rancher.space/v3/users/u-mvhtt?action=setpassword'
      },
      annotations: { 'lifecycle.cattle.io/create.mgmt-auth-users-controller': 'true' },
      baseType:    'user',
      conditions:  [
        {
          lastUpdateTime: '2024-07-10T01:02:13Z',
          status:         'True',
          type:           'InitialRolesPopulated'
        }
      ],
      created:     '2024-07-10T01:02:13Z',
      createdTS:   1720573333000,
      creatorId:   'user-4g8mm',
      description: '',
      enabled:     true,
      id:          'u-mvhtt',
      labels:      { 'cattle.io/creator': 'norman' },
      links:       {
        clusterRoleTemplateBindings: 'https://yonasb29h3.qa.rancher.space/v3/clusterRoleTemplateBindings?userId=u-mvhtt',
        globalRoleBindings:          'https://yonasb29h3.qa.rancher.space/v3/globalRoleBindings?userId=u-mvhtt',
        projectRoleTemplateBindings: 'https://yonasb29h3.qa.rancher.space/v3/projectRoleTemplateBindings?userId=u-mvhtt',
        remove:                      'https://yonasb29h3.qa.rancher.space/v3/users/u-mvhtt',
        self:                        'https://yonasb29h3.qa.rancher.space/v3/users/u-mvhtt',
        tokens:                      'https://yonasb29h3.qa.rancher.space/v3/tokens?userId=u-mvhtt',
        update:                      'https://yonasb29h3.qa.rancher.space/v3/users/u-mvhtt'
      },
      me:                 false,
      mustChangePassword: false,
      principalIds:       [
        'local://u-mvhtt'
      ],
      state:                'active',
      transitioning:        'no',
      transitioningMessage: '',
      type:                 'user',
      username:             'e2e-test-dummy-data',
      uuid:                 'da4fa38b-7907-4b39-879e-b34d7dc0da05'
    },
    {
      actions: {
        refreshauthprovideraccess: 'https://yonasb29h3.qa.rancher.space/v3/users/user-4g8mm?action=refreshauthprovideraccess',
        setpassword:               'https://yonasb29h3.qa.rancher.space/v3/users/user-4g8mm?action=setpassword'
      },
      annotations: { 'lifecycle.cattle.io/create.mgmt-auth-users-controller': 'true' },
      baseType:    'user',
      conditions:  null,
      created:     '2024-07-08T22:17:51Z',
      createdTS:   1720477071000,
      creatorId:   null,
      description: '',
      enabled:     true,
      id:          'user-4g8mm',
      labels:      {
        'authz.management.cattle.io/bootstrapping': 'admin-user',
        'cattle.io/last-login':                     '1720573332'
      },
      links: {
        clusterRoleTemplateBindings: 'https://yonasb29h3.qa.rancher.space/v3/clusterRoleTemplateBindings?userId=user-4g8mm',
        globalRoleBindings:          'https://yonasb29h3.qa.rancher.space/v3/globalRoleBindings?userId=user-4g8mm',
        projectRoleTemplateBindings: 'https://yonasb29h3.qa.rancher.space/v3/projectRoleTemplateBindings?userId=user-4g8mm',
        remove:                      'https://yonasb29h3.qa.rancher.space/v3/users/user-4g8mm',
        self:                        'https://yonasb29h3.qa.rancher.space/v3/users/user-4g8mm',
        tokens:                      'https://yonasb29h3.qa.rancher.space/v3/tokens?userId=user-4g8mm',
        update:                      'https://yonasb29h3.qa.rancher.space/v3/users/user-4g8mm'
      },
      me:                 true,
      mustChangePassword: false,
      name:               'Default Admin',
      principalIds:       [
        'local://user-4g8mm'
      ],
      state:                'active',
      transitioning:        'no',
      transitioningMessage: '',
      type:                 'user',
      username:             'admin',
      uuid:                 'a56131bb-fbc0-4afd-b0fd-dd7eb5e90875'
    }
  ]
};

function reply(statusCode: number, body: any) {
  return (req) => {
    req.reply({
      statusCode,
      body
    });
  };
}

export function generateUsersDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/management.cattle.io.users?*', reply(200, usersGetResponseSmallSet)).as('usersDataSmall');
}
