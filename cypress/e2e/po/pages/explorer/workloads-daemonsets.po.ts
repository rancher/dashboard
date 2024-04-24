import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';

export class WorkloadsDaemonsetsListPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/apps.daemonset`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(WorkloadsDaemonsetsListPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(WorkloadsDaemonsetsListPagePo.createPath(clusterId));
  }

  goToeditItemWithName(name:string) {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.actionMenu(name).getMenuItem('Edit Config').click();
  }

  listElementWithName(name:string) {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().rowElementWithName(name);
  }
}

export class WorkLoadsDaemonsetsEditPagePo extends PagePo {
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

  clickTab(selector: string) {
    return new TabbedPo().clickTabWithSelector(selector);
  }

  ScalingUpgradePlicyRadioBtn(): RadioGroupInputPo {
    return new RadioGroupInputPo('[data-testid="input-policy-strategy"]');
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }
}
