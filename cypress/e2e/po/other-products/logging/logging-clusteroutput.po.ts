import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import ResourceListMastheadPo from '@/cypress/e2e/po/components/ResourceList/resource-list-masthead.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import SelectPo from '@/cypress/e2e/po/components/select.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

export class LoggingClusteroutputListPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/logging/logging.banzaicloud.io.clusteroutput`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(LoggingClusteroutputListPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(LoggingClusteroutputListPagePo.createPath(clusterId));
  }

  masthead() {
    return new ResourceListMastheadPo(this.self());
  }

  createLoggingOutput() {
    return this.masthead().create();
  }

  listElementWithName(name:string) {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().rowElementWithName(name);
  }
}

export class LoggingClusteroutputEditPagePo extends PagePo {
  static url: string;

  private static createPath( clusterId: string, name: string ) {
    const urlStr = `/c/${ clusterId }/logging/logging.banzaicloud.io.clusteroutput/${ name }#`;

    return urlStr;
  }

  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(this.url);
  }

  constructor(clusterId = 'local', name = 'create') {
    super(LoggingClusteroutputEditPagePo.createPath(clusterId, name));

    LoggingClusteroutputEditPagePo.url = LoggingClusteroutputEditPagePo.createPath(clusterId, name);
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  clickTab(selector: string) {
    return new TabbedPo().clickTabWithSelector(selector);
  }

  selectOutputProviderWithLabel(providerName: string) {
    return new SelectPo(this.self()).clickOptionWithLabel(providerName);
  }

  target(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'URL');
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }
}
