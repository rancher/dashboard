import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';

export class ChartsPage extends PagePo {
  static url: string = '/c/local/apps/charts/chart?repo-type=cluster&repo=rancher-charts'

  constructor(pageUrl = ChartsPage.url) {
    ChartsPage.url = pageUrl;
    super(ChartsPage.url);
  }

  goToInstall() {
    const btn = new AsyncButtonPo('[data-testid="btn-chart-install"]');

    btn.click();

    return this;
  }

  nextPage() {
    const btn = new AsyncButtonPo('.controls-steps .btn.role-primary');

    btn.click();

    return this;
  }

  editOptions(options: TabbedPo, selector: string) {
    options.clickTabWithSelector(selector);

    return this;
  }

  installChart() {
    const btn = new AsyncButtonPo('[data-testid="action-button-async-button"]');

    btn.click();

    return this;
  }

  editYaml() {
    this.self().get('[data-testid="btn-group-options-view"]').contains('Edit YAML').click();

    return this;
  }
}
