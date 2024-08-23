import { generateV2MonitoringForLocalCluster } from '@/cypress/e2e/blueprints/other-products/v2-monitoring.js';
import V2Monitoring from '@/cypress/e2e/po/other-products/v2-monitoring.po';
import PreferencesPagePo from '@/cypress/e2e/po/pages/preferences.po';

describe.skip('[Vue3 Skip]: V2 monitoring Chart', { tags: ['@charts', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();

    // all intercepts needed to mock install of V2 monitoring
    generateV2MonitoringForLocalCluster();
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

      v2Monitoring.prometheusRuleGroupName(0).self().scrollIntoView();
      v2Monitoring.prometheusRuleGroupName(0).set('group-name-0');
      v2Monitoring.prometheusRuleGroupInterval(0).setValue('60');
      v2Monitoring.prometheusRulesAddRecord(0).click();
      v2Monitoring.prometheusRulesRecordName(0).self().scrollIntoView();
      v2Monitoring.prometheusRulesRecordName(0).set('record-0');
      v2Monitoring.prometheusRulesRecordPromQl(0).self().scrollIntoView();
      v2Monitoring.prometheusRulesRecordPromQl(0).set('promql-0');

      v2Monitoring.newPrometheusRuleAddBtn().click();
      v2Monitoring.clickTab('#group-1');

      v2Monitoring.prometheusRuleGroupName(1).self().scrollIntoView();
      v2Monitoring.prometheusRuleGroupName(1).set('group-name-1');
      v2Monitoring.prometheusRuleGroupInterval(1).setValue('61');
      v2Monitoring.prometheusRulesAddRecord(1).click();
      v2Monitoring.prometheusRulesRecordName(1).self().scrollIntoView();
      v2Monitoring.prometheusRulesRecordName(1).set('record-1');
      v2Monitoring.prometheusRulesRecordPromQl(1).self().scrollIntoView();
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

    // testing https://github.com/rancher/dashboard/issues/9923
    it('Alerting Rules "Severity" select should NOT be translating the values to Chinese', () => {
      // this intercept is for the payload of the creation of prometheusrules, which is what we want to test
      cy.intercept('POST', 'k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules', (req: any) => {
        req.reply({
          statusCode: 201,
          body:       {}
        });
      }).as('prometheusRulesCreation');

      const prefPage = new PreferencesPagePo();

      // change language to chinese
      prefPage.goTo();
      prefPage.languageDropdownMenu().checkVisible();
      prefPage.languageDropdownMenu().toggle();
      prefPage.languageDropdownMenu().isOpened();
      prefPage.languageDropdownMenu().getOptions().should('have.length', 2);
      prefPage.languageDropdownMenu().clickOption(2);
      prefPage.languageDropdownMenu().isClosed();

      const v2Monitoring = new V2Monitoring('local');

      // go to v2 monitoring on local cluster
      v2Monitoring.goTo();
      v2Monitoring.waitForPage();

      // // open Advanced group (default is PrometheusRules)
      v2Monitoring.navToSideMenuGroupByLabel('Advanced');
      v2Monitoring.waitForPage();

      // create a new PrometheusRule
      v2Monitoring.createChinese().click();
      v2Monitoring.waitForPage();

      v2Monitoring.nameNsDescription().name().set('some-prom-rules');

      v2Monitoring.prometheusRuleGroupName(0).self().scrollIntoView();
      v2Monitoring.prometheusRuleGroupName(0).set('group-name-0');
      v2Monitoring.prometheusRuleGroupInterval(0).setValue('60');

      v2Monitoring.prometheusRulesAddAlert(0).click();
      v2Monitoring.prometheusRulesAlertName(0).self().scrollIntoView();
      v2Monitoring.prometheusRulesAlertName(0).set('record-0');
      v2Monitoring.prometheusRulesAlertPromQl(0).self().scrollIntoView();
      v2Monitoring.prometheusRulesAlertPromQl(0).set('promql-0');

      // critical option
      v2Monitoring.alertingRuleSeveritySelect(0).toggle();
      v2Monitoring.alertingRuleSeveritySelect(0).clickOption(1);

      v2Monitoring.saveCreateForm().click();

      cy.wait('@prometheusRulesCreation', { requestTimeout: 4000 }).then((req) => {
        expect(req.request.body.spec.groups[0].rules[0].labels.severity).to.equal('critical');
      });
    });
  });
});
