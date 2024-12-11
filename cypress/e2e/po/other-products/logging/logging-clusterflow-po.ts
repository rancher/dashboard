import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import ResourceListMastheadPo from '@/cypress/e2e/po/components/ResourceList/resource-list-masthead.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';

export class LoggingClusterflowListPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/logging/logging.banzaicloud.io.clusterflow`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(LoggingClusterflowListPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(LoggingClusterflowListPagePo.createPath(clusterId));
  }

  masthead() {
    return new ResourceListMastheadPo(this.self());
  }

  createLoggingFlow() {
    return this.masthead().create();
  }

  listElementWithName(name:string) {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().rowElementWithName(name);
  }

  rowLinkWithName(name: string) {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().detailsPageLinkWithName(name);
  }
}

export class LoggingClusterflowEditPagePo extends PagePo {
  static url: string;

  private static createPath( clusterId: string, name: string ) {
    const urlStr = `/c/${ clusterId }/logging/logging.banzaicloud.io.clusterflow/${ name }#`;

    return urlStr;
  }

  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(this.url);
  }

  constructor(clusterId = 'local', name = 'create') {
    super(LoggingClusterflowEditPagePo.createPath(clusterId, name));

    LoggingClusterflowEditPagePo.url = LoggingClusterflowEditPagePo.createPath(clusterId, name);
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  outputsTab() {
    return new TabbedPo().clickTabWithSelector('[data-testid="btn-outputs"]');
  }

  outputSelector() {
    return new LabeledSelectPo('section#outputs .labeled-select');
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  ruleItem(index: number) {
    return new ArrayListPo(this.self()).arrayListItem(index);
  }
}
