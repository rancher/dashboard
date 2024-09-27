// GET /v3/tokens - return empty tokens data
const tokensGetResponseEmptySet = {
  type:         'collection',
  links:        { self: 'https://yonasb29.qa.rancher.space/v3/tokens' },
  createTypes:  { token: 'https://yonasb29.qa.rancher.space/v3/tokens' },
  actions:      {},
  pagination:   { limit: 1000 },
  resourceType: 'token',
  data:         []
};

// GET /v3/tokens - small set of tokens data
const tokensGetResponseSmallSet = {
  type:        'collection',
  links:       { self: 'https://yonasb29.qa.rancher.space/v3/tokens' },
  createTypes: { token: 'https://yonasb29.qa.rancher.space/v3/tokens' },
  actions:     {},
  pagination:  { limit: 1000 },
  sort:        {
    order:   'asc',
    reverse: 'https://yonasb29.qa.rancher.space/v3/tokens?order=desc',
    links:   {
      authProvider:   'https://yonasb29.qa.rancher.space/v3/tokens?sort=authProvider',
      description:    'https://yonasb29.qa.rancher.space/v3/tokens?sort=description',
      expiresAt:      'https://yonasb29.qa.rancher.space/v3/tokens?sort=expiresAt',
      lastUpdateTime: 'https://yonasb29.qa.rancher.space/v3/tokens?sort=lastUpdateTime',
      token:          'https://yonasb29.qa.rancher.space/v3/tokens?sort=token',
      uuid:           'https://yonasb29.qa.rancher.space/v3/tokens?sort=uuid'
    }
  },
  filters: {
    authProvider:   null,
    clusterId:      null,
    created:        null,
    creatorId:      null,
    current:        null,
    description:    null,
    enabled:        null,
    expired:        null,
    expiresAt:      null,
    isDerived:      null,
    lastUpdateTime: null,
    name:           null,
    removed:        null,
    token:          null,
    ttl:            null,
    userId:         null,
    userPrincipal:  null,
    uuid:           null
  },
  resourceType: 'token',
  data:         [
    {
      authProvider: 'local',
      baseType:     'token',
      clusterId:    null,
      created:      '2024-06-17T17:32:07Z',
      createdTS:    1718645527000,
      creatorId:    null,
      current:      false,
      description:  'Kubeconfig token',
      enabled:      true,
      expired:      false,
      expiresAt:    '2024-07-17T17:32:07Z',
      id:           'aaa-e2e-vai-test-token-name',
      isDerived:    true,
      labels:       {
        'authn.management.cattle.io/kind':         'kubeconfig',
        'authn.management.cattle.io/token-userId': 'user-btq9q',
        'cattle.io/creator':                       'norman'
      },
      lastUpdateTime: '',
      links:          {
        remove: 'https://yonasb29.qa.rancher.space/v3/tokens/kubeconfig-user-btq9q8dl9x',
        self:   'https://yonasb29.qa.rancher.space/v3/tokens/kubeconfig-user-btq9q8dl9x',
        update: 'https://yonasb29.qa.rancher.space/v3/tokens/kubeconfig-user-btq9q8dl9x'
      },
      name:          'kubeconfig-user-btq9q8dl9x',
      ttl:           2592000000,
      type:          'token',
      userId:        'user-btq9q',
      userPrincipal: 'map[displayName:Default Admin loginName:admin me:true metadata:map[creationTimestamp:<nil> name:local://user-btq9q] principalType:user provider:local]',
      uuid:          'd801c997-fd36-4ed1-8835-7a741a302b26'
    },
    {
      authProvider: 'local',
      baseType:     'token',
      clusterId:    null,
      created:      '2024-06-17T17:29:05Z',
      createdTS:    1718645345000,
      creatorId:    null,
      current:      false,
      description:  'Kubeconfig token',
      enabled:      true,
      expired:      false,
      expiresAt:    '2024-07-17T17:29:05Z',
      id:           'kubeconfig-user-btq9q98fn7',
      isDerived:    true,
      labels:       {
        'authn.management.cattle.io/kind':         'kubeconfig',
        'authn.management.cattle.io/token-userId': 'user-btq9q',
        'cattle.io/creator':                       'norman'
      },
      lastUpdateTime: '',
      links:          {
        remove: 'https://yonasb29.qa.rancher.space/v3/tokens/kubeconfig-user-btq9q98fn7',
        self:   'https://yonasb29.qa.rancher.space/v3/tokens/kubeconfig-user-btq9q98fn7',
        update: 'https://yonasb29.qa.rancher.space/v3/tokens/kubeconfig-user-btq9q98fn7'
      },
      name:          'kubeconfig-user-btq9q98fn7',
      ttl:           2592000000,
      type:          'token',
      userId:        'user-btq9q',
      userPrincipal: 'map[displayName:Default Admin loginName:admin me:true metadata:map[creationTimestamp:<nil> name:local://user-btq9q] principalType:user provider:local]',
      uuid:          'f1003a82-8923-4a8c-831a-94e72f9576ff'
    },
    {
      authProvider: 'local',
      baseType:     'token',
      clusterId:    null,
      created:      '2024-06-17T17:32:06Z',
      createdTS:    1718645526000,
      creatorId:    null,
      current:      false,
      description:  'Kubeconfig token',
      enabled:      true,
      expired:      false,
      expiresAt:    '2024-07-17T17:32:06Z',
      id:           'kubeconfig-user-btq9q9p8lv',
      isDerived:    true,
      labels:       {
        'authn.management.cattle.io/kind':         'kubeconfig',
        'authn.management.cattle.io/token-userId': 'user-btq9q',
        'cattle.io/creator':                       'norman'
      },
      lastUpdateTime: '',
      links:          {
        remove: 'https://yonasb29.qa.rancher.space/v3/tokens/kubeconfig-user-btq9q9p8lv',
        self:   'https://yonasb29.qa.rancher.space/v3/tokens/kubeconfig-user-btq9q9p8lv',
        update: 'https://yonasb29.qa.rancher.space/v3/tokens/kubeconfig-user-btq9q9p8lv'
      },
      name:          'kubeconfig-user-btq9q9p8lv',
      ttl:           2592000000,
      type:          'token',
      userId:        'user-btq9q',
      userPrincipal: 'map[displayName:Default Admin loginName:admin me:true metadata:map[creationTimestamp:<nil> name:local://user-btq9q] principalType:user provider:local]',
      uuid:          '82a1bc74-51a6-4230-aaa8-bb308712fcb8'
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

export function tokensNoData(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v3/tokens', reply(200, tokensGetResponseEmptySet)).as('tokensNoData');
}

export function generateTokensDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v3/tokens', reply(200, tokensGetResponseSmallSet)).as('tokensDataSmall');
}
