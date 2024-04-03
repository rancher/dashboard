import { v1Schemas, v3Schemas, k8sSchemas } from '@/cypress/e2e/blueprints/schemas/v2-monitoring.js';
import {
  podMonitorsGet, serviceMonitorsGet, alertManagerConfigsGet,
  rancherMonitoringAlertmanagerGet, alertManagerRancherMonitoringAlertmanagerGet, prometheusRulesGet, prometheusesGet
} from '@/cypress/e2e/blueprints/other-products-requests/v2-monitoring.js';
import V2Monitoring from '~/cypress/e2e/po/other-products/v2-monitoring.po';

function reply(statusCode: number, body: any): any {
  return (req: any) => {
    req.reply({
      statusCode,
      body
    });
  };
}

describe('V2 monitoring Chart', { tags: ['@charts', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();

    // all intercepts needed to mock install of V2 monitoring
    cy.intercept('GET', `/v1/schemas?*`, (req) => {
      req.continue((res) => {
        const schemaData = [...res.body.data, ...v1Schemas];

        res.body.data = schemaData;
        res.send(res.body);
      });
    }).as('v1Schemas');

    cy.intercept('GET', `/v3/schemas`, (req) => {
      req.continue((res) => {
        const schemaData = [...res.body.data, ...v3Schemas];

        res.body.data = schemaData;
        res.send(res.body);
      });
    }).as('v3Schemas');

    cy.intercept('GET', `/k8s/clusters/local/v1/schemas?*`, (req) => {
      req.continue((res) => {
        const schemaData = [...res.body.data, ...k8sSchemas];

        res.body.data = schemaData;
        res.send(res.body);
      });
    }).as('k8sSchemas');

    // NOTE: alertManagerConfigsGet has an item for the proxyURL test
    // testing https://github.com/rancher/dashboard/issues/10389
    const interceptsData = [
      ['/k8s/clusters/local/v1/monitoring.coreos.com.podmonitors', podMonitorsGet],
      ['/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors', serviceMonitorsGet],
      ['/k8s/clusters/local/v1/monitoring.coreos.com.alertmanagerconfigs', alertManagerConfigsGet],
      ['/k8s/clusters/local/v1/monitoring.coreos.com.alertmanagers/cattle-monitoring-system/rancher-monitoring-alertmanager', rancherMonitoringAlertmanagerGet],
      ['/k8s/clusters/local/v1/secrets/cattle-monitoring-system/alertmanager-rancher-monitoring-alertmanager', alertManagerRancherMonitoringAlertmanagerGet],
      ['/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules', prometheusRulesGet],
      ['/k8s/clusters/local/v1/monitoring.coreos.com.prometheuses', prometheusesGet],
    ];

    interceptsData.forEach((requestData, i) => {
      cy.intercept('GET', `${ requestData[0] }?*`,
        reply(200, requestData[1])).as(`monitoring-req-${ i }`);
    });
  });

  describe('V2 monitoring resources', () => {
    it('alertmanagerconfig should have property "proxyURL" correctly filled out', () => {
      // this intercept is for the payload of the receiver, which is what we want to test
      cy.intercept('PUT', 'k8s/clusters/local/v1/monitoring.coreos.com.alertmanagerconfigs/default/test-alert', (req: any) => {
        req.reply({
          statusCode: 201,
          body:       {}
        });
      }).as('receiverCreation');

      const v2Monitoring = new V2Monitoring('local');

      // go to v2 monitoring on local cluster
      v2Monitoring.goTo();
      v2Monitoring.waitForPage();

      // open Alerting group
      v2Monitoring.navToSideMenuGroupByLabel('Alerting');
      v2Monitoring.waitForPage();

      // edit a pre-added alert manager config
      v2Monitoring.editV2MonitoringItem('test-alert');
      v2Monitoring.waitForPage();

      // edit form and click save
      v2Monitoring.alertManagerConfigAddReceiver();
      v2Monitoring.clickTab('#pagerduty');
      v2Monitoring.addPagerDutyReceiver();

      v2Monitoring.receiverName().set('some-name');
      v2Monitoring.proxyUrl().set('some-url');
      v2Monitoring.saveCreateForm().click();

      cy.wait('@receiverCreation', { requestTimeout: 4000 }).then((req) => {
        expect(req.request.body.spec.receivers[0].pagerdutyConfigs[0].httpConfig.proxyURL).to.equal('some-url');
      });
    });

    it('multiple Alerting Rules in PrometheusRule should have different values', () => {
      // this intercept is for the payload of the creation of prometheusrules, which is what we want to test
      cy.intercept('POST', 'k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules', (req: any) => {
        req.reply({
          statusCode: 201,
          body:       {}
        });
      }).as('prometheusRulesCreation');

      const v2Monitoring = new V2Monitoring('local');

      // go to v2 monitoring on local cluster
      v2Monitoring.goTo();
      v2Monitoring.waitForPage();

      // open Advanced group (default is PrometheusRules)
      v2Monitoring.navToSideMenuGroupByLabel('Advanced');
      v2Monitoring.waitForPage();

      // create a new PrometheusRule
      v2Monitoring.create().click();
      v2Monitoring.waitForPage();

      // edit form and click save;
      v2Monitoring.nameNsDescription().name().set('some-prom-rules');

      v2Monitoring.prometheusRuleGroupName(0).set('group-name-0');
      v2Monitoring.setPrometheusRuleGroupInterval(0, '60');
      v2Monitoring.prometheusRulesAddRecord(0).click();
      v2Monitoring.prometheusRulesRecordName(0).set('record-0');
      v2Monitoring.prometheusRulesRecordPromQl(0).set('promql-0');

      v2Monitoring.newPrometheusRuleAddBtn().click();
      v2Monitoring.clickTab('#group-1');

      v2Monitoring.prometheusRuleGroupName(1).set('group-name-1');
      v2Monitoring.setPrometheusRuleGroupInterval(1, '61');
      v2Monitoring.prometheusRulesAddRecord(1).click();
      v2Monitoring.prometheusRulesRecordName(1).set('record-1');
      v2Monitoring.prometheusRulesRecordPromQl(1).set('promql-1');

      v2Monitoring.saveCreateForm().click();

      cy.wait('@prometheusRulesCreation', { requestTimeout: 4000 }).then((req) => {
        expect(req.request.body.spec.groups[0]).to.deep.equal({
          name:     'group-name-0',
          interval: '60s',
          rules:    [
            {
              record: 'record-0',
              expr:   'promql-0',
              labels: {
                severity:     'none',
                namespace:    'default',
                cluster_id:   'local',
                cluster_name: 'local'
              }
            }
          ]
        });
        expect(req.request.body.spec.groups[1]).to.deep.equal({
          name:     'group-name-1',
          interval: '61s',
          rules:    [
            {
              record: 'record-1',
              expr:   'promql-1',
              labels: {
                severity:     'none',
                namespace:    'default',
                cluster_id:   'local',
                cluster_name: 'local'
              }
            }
          ]
        });
      });
    });
  });
});
