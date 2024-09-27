const annotationsBase = { 'catalog.cattle.io/certified': 'rancher' };

const chartBase = {
  apiVersion:  'v1',
  home:        'https://test',
  version:     '1.0.0',
  description: 'description',
  appVersion:  '1.0.0',
};

const deprecatedChart = {
  ...chartBase,
  annotations: {
    ...annotationsBase,
    'catalog.cattle.io/display-name': 'deprecatedChart',
  },
  name:       'deprecatedChart',
  deprecated: true
};
const experimentalChart = {
  ...chartBase,
  annotations: {
    ...annotationsBase,
    'catalog.cattle.io/display-name': 'experimentalChart',
    'catalog.cattle.io/experimental': true
  },
  name: 'experimentalChart',
};
const deprecatedAndExperimentalChart = {
  ...chartBase,
  annotations: {
    ...annotationsBase,
    'catalog.cattle.io/display-name': 'deprecatedAndExperimentalChart',
    'catalog.cattle.io/experimental': true
  },
  name:       'deprecatedAndExperimentalChart',
  deprecated: true
};

export function generateDeprecatedAndExperimentalCharts(): Cypress.Chainable<Response> {
  return cy.intercept('GET', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?link=index', (req) => {
    req.continue((res) => {
      res.send({
        ...res.body,
        entries: {
          ...res.body.entries,
          deprecatedChart:                [deprecatedChart],
          experimentalChart:              [experimentalChart],
          deprecatedAndExperimentalChart: [deprecatedAndExperimentalChart],
        }
      });
    });
  }).as('generateDeprecatedAndExperimentalCharts');
}

export function generateDeprecatedAndExperimentalChart(): Cypress.Chainable<Response> {
  return cy.intercept('GET', `v1/catalog.cattle.io.clusterrepos/rancher-charts?link=info&chartName=${ deprecatedAndExperimentalChart.name }&version=${ deprecatedAndExperimentalChart.version }`, (req) => {
    req.reply({
      statusCode: 200,
      body:       { chart: { name: deprecatedAndExperimentalChart.name } }
    });
  }).as('generateDeprecatedAndExperimentalChart');
}
