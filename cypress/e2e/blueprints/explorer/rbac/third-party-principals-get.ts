const res = {
  type:       'collection',
  links:      { self: 'https://localhost:8005/v3/principals' },
  actions:    { search: 'https://localhost:8005/v3/principals?action=search' },
  pagination: { limit: 1000 },
  sort:       {
    order:   'asc',
    reverse: 'https://localhost:8005/v3/principals?order=desc',
    links:   {
      loginName: 'https://localhost:8005/v3/principals?sort=loginName', name: 'https://localhost:8005/v3/principals?sort=name', principalType: 'https://localhost:8005/v3/principals?sort=principalType', profilePicture: 'https://localhost:8005/v3/principals?sort=profilePicture', profileURL: 'https://localhost:8005/v3/principals?sort=profileURL', provider: 'https://localhost:8005/v3/principals?sort=provider', uuid: 'https://localhost:8005/v3/principals?sort=uuid'
    }
  },
  filters: {
    created: null, creatorId: null, id: null, loginName: null, me: null, memberOf: null, name: null, principalType: null, profilePicture: null, profileURL: null, provider: null, removed: null, uuid: null
  },
  resourceType: 'principal',
  data:         [
    {
      baseType:      'principal',
      created:       null,
      creatorId:     null,
      id:            'github://1234567890',
      links:         { self: 'https://localhost:8005/v3/principals/github:%2F%2F1234567890' },
      loginName:     'admin',
      me:            true,
      memberOf:      false,
      name:          'Default Admin',
      principalType: 'user',
      provider:      'github',
      type:          'principal'
    }
  ]
};

export function spoofThirdPartyPrincipal(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v3/principals', (req) => {
    req.reply({
      statusCode: 200,
      body:       res
    });
  }).as('spoofThirdPartyPrincipal');
}
