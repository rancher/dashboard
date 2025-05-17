import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';

export class WorkloadsDaemonsetsListPagePo extends BaseListPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/apps.daemonset`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(WorkloadsDaemonsetsListPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(WorkloadsDaemonsetsListPagePo.createPath(clusterId));
  }
}

export class WorkLoadsDaemonsetsCreatePagePo extends BaseDetailPagePo {
  static url: string;

  private static createPath(clusterId: string, queryParams?: Record<string, string>) {
    const urlStr = `/c/${ clusterId }/explorer/apps.daemonset/create`;

    if (!queryParams) {
      return urlStr;
    }

    const params = new URLSearchParams(queryParams);

    return `${ urlStr }?${ params.toString() }`;
  }

  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(this.url);
  }

  constructor(clusterId = 'local', queryParams?: Record<string, string>) {
    super(WorkLoadsDaemonsetsCreatePagePo.createPath(clusterId, queryParams));

    WorkLoadsDaemonsetsCreatePagePo.url = WorkLoadsDaemonsetsCreatePagePo.createPath(clusterId, queryParams);
  }
}

export class WorkLoadsDaemonsetsEditPagePo extends BaseDetailPagePo {
  static url: string;

  private static createPath(daemonsetId: string, clusterId: string, namespaceId: string, queryParams?: Record<string, string>) {
    const urlStr = `/c/${ clusterId }/explorer/apps.daemonset/${ namespaceId }/${ daemonsetId }`;

    if (!queryParams) {
      return urlStr;
    }

    const params = new URLSearchParams(queryParams);

    return `${ urlStr }?${ params.toString() }`;
  }

  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(this.url);
  }

  constructor(daemonsetId: string, queryParams?: Record<string, string>, clusterId = 'local', namespaceId = 'default') {
    super(WorkLoadsDaemonsetsEditPagePo.createPath(daemonsetId, clusterId, namespaceId, queryParams));

    WorkLoadsDaemonsetsEditPagePo.url = WorkLoadsDaemonsetsEditPagePo.createPath(daemonsetId, clusterId, namespaceId, queryParams);
  }

  containerImageInput(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Container Image');
  }

  clickTab(selector: string) {
    return new TabbedPo().clickTabWithSelector(selector);
  }

  ScalingUpgradePolicyRadioBtn(): RadioGroupInputPo {
    return new RadioGroupInputPo('[data-testid="input-policy-strategy"]');
  }
}
