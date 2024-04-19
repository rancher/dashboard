import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import SelectPo from '@/cypress/e2e/po/components/select.po';

import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';

export class ChartsPage extends PagePo {
  static url = '/c/local/apps/charts/chart?repo-type=cluster&repo=rancher-charts'

  constructor(pageUrl = ChartsPage.url) {
    ChartsPage.url = pageUrl;
    super(ChartsPage.url);
  }

  chartsCarousel() {
    return this.self().find('[data-testid="charts-carousel"]');
  }

  chartsCarouselSlides() {
    return this.chartsCarousel().get('[id="slide-track"] > div');
  }

  chartsFilterInput() {
    return this.self().find('[data-testid="charts-filter-input"]');
  }

  chartsFilterCategoriesSelect() {
    return new SelectPo(this.self().find('[data-testid="charts-filter-category"]'));
  }

  chartsFilterReposSelect() {
    return new SelectPo(this.self().find('[data-testid="charts-filter-repos"]'));
  }

  goToInstall() {
    const btn = new AsyncButtonPo('.chart-header .btn.role-primary');

    btn.click(true);

    return this;
  }

  nextPage() {
    const btn = new AsyncButtonPo('.controls-steps .btn.role-primary');

    btn.click(true);

    return this;
  }

  editOptions(options: TabbedPo, selector: string) {
    options.clickTabWithSelector(selector);

    return this;
  }

  installChart() {
    const btn = new AsyncButtonPo('[data-testid="action-button-async-button"]');

    btn.click(true);

    return this;
  }

  editYaml() {
    this.self().get('[data-testid="btn-group-options-view"]').contains('Edit YAML').click();

    return this;
  }

  tabsCountOnInstallQuestions() {
    return new TabbedPo().allTabs();
  }

  bannerContent() {
    return new BannersPo('[data-testid="banner-content"]', this.self()).bannerElement('span');
  }
}
