import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import RedeployDialogPo from '@/cypress/e2e/po/components/workloads/redeploy-dialog.po';

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

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Workloads');
    sideNav.navToSideMenuEntryByLabel('DaemonSets');
  }

  redeployDialog(): RedeployDialogPo {
    return new RedeployDialogPo();
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
