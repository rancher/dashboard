import PagePo from '@/cypress/e2e/po/pages/page.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
import V2MonitoringListPo from '@/cypress/e2e/po/other-products/v2-monitoring-list.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import UnitInputPo from '@/cypress/e2e/po/components/unit-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';

export default class V2MonitoringPo extends PagePo {
  static createPath(clusterId: string) {
    return `/c/${ clusterId }/monitoring`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(V2MonitoringPo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(V2MonitoringPo.createPath(clusterId));
  }

  create(): Cypress.Chainable {
    return this.list().masthead().actions().contains('Create');
  }

  createChinese(): Cypress.Chainable {
    return this.list().masthead().actions().contains('创建');
  }

  createFromYaml(): Cypress.Chainable {
    return this.list().masthead().actions().contains('Create from YAML');
  }

  editV2MonitoringItem(name: string) {
    const resourceTable = new ResourceTablePo(this.self());

    return resourceTable.sortableTable().rowActionMenuOpen(name).getMenuItem('Edit Config').click();
  }

  alertManagerConfigAddReceiver() {
    return cy.get('[data-testid="v2-monitoring-add-receiver"]').click();
  }

  clickTab(selector: string) {
    return new TabbedPo().clickTabWithSelector(selector);
  }

  addPagerDutyReceiver() {
    return cy.get('div[data-testid="array-list-button"] button').click();
  }

  receiverName() {
    return new LabeledInputPo(cy.get('[data-testid="v2-monitoring-receiver-name"]'));
  }

  proxyUrl() {
    return new LabeledInputPo(cy.get('[data-testid="v2-monitoring-receiver-pagerduty-proxy-url"]'));
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  prometheusRuleGroupName(index: number) {
    return new LabeledInputPo(cy.get(`[data-testid="v2-monitoring-prom-rules-group-name-${ index }"]`));
  }

  prometheusRuleGroupInterval(index: number) {
    return new UnitInputPo(cy.get(`[data-testid="v2-monitoring-prom-rules-group-interval-${ index }"]`));
  }

  newPrometheusRuleAddBtn() {
    return cy.get('[data-testid="tab-list-add"]');
  }

  prometheusRulesAddRecord(index: number) {
    return cy.get(`[id=group-${ index }] [data-testid="v2-monitoring-add-record"]`);
  }

  prometheusRulesRecordName(index: number) {
    return new LabeledInputPo(cy.get(`[id=group-${ index }] [data-testid="v2-monitoring-prom-rules-recording-name"]`));
  }

  prometheusRulesRecordPromQl(index: number): CodeMirrorPo {
    return CodeMirrorPo.bySelector(cy.get(`body [id=group-${ index }]`), '[data-testid="v2-monitoring-prom-rules-recording-promql"]');
  }

  prometheusRulesAddAlert(index: number) {
    return cy.get(`[id=group-${ index }] [data-testid="v2-monitoring-add-alert"]`);
  }

  alertingRuleSeveritySelect(index: number) {
    return new LabeledSelectPo(`[id=group-${ index }] [data-testid="v2-monitoring-alerting-rules-severity"]`, this.self());
  }

  prometheusRulesAlertName(index: number) {
    return new LabeledInputPo(cy.get(`[id=group-${ index }] [data-testid="v2-monitoring-alerting-rules-alert-name"]`));
  }

  prometheusRulesAlertPromQl(index: number): CodeMirrorPo {
    return CodeMirrorPo.bySelector(cy.get(`body [id=group-${ index }]`), '[data-testid="v2-monitoring-alerting-rules-promql"]');
  }

  goToDetailsPage(elemName: string) {
    const resourceTable = new ResourceTablePo(this.self());

    return resourceTable.sortableTable().detailsPageLinkWithName(elemName).click();
  }

  list(): V2MonitoringListPo {
    return new V2MonitoringListPo('[data-testid="sortable-table-list-container"]');
  }

  yamlEditor(): CodeMirrorPo {
    return CodeMirrorPo.bySelector(this.self(), '[data-testid="yaml-editor-code-mirror"]');
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }
}
