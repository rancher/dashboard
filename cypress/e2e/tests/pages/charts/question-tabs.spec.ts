import { ChartsPage } from '@/cypress/e2e/po/pages/charts.po';

describe('Charts Install', { tags: ['@charts', '@adminUser'] }, () => {
  const chartsPageUrl = '/c/local/apps/charts/chart?repo-type=cluster&repo=rancher-charts';

  describe('Question tabs', () => {
    beforeEach(() => {
      cy.login();
    });

    describe('Vsphere Cpi chart install - Tabs visibility', () => {
      it('Should not show any tabs on "Edit Options" screen if there is only 1 group', () => {
        const vsphereCpiVersion = '102.1.0%2Bup1.5.1';
        const chartsVsphereCpiPage = `${ chartsPageUrl }&chart=rancher-vsphere-cpi&version=${ vsphereCpiVersion }`;
        const chartsPage: ChartsPage = new ChartsPage(chartsVsphereCpiPage);

        chartsPage.goTo();
        chartsPage.goToInstall().nextPage();

        chartsPage.tabsCountOnInstallQuestions().should('not.have.length');
      });
    });

    describe('Epinio chart install - Tabs visibility', () => {
      it('Should show tabs on "Edit Options" screen because there is more than 1 group', () => {
        const epinioVersion = '103.0.2%2Bup1.10.0';
        const chartsEpinioPage = `${ chartsPageUrl }&chart=epinio&version=${ epinioVersion }`;
        const chartsPage: ChartsPage = new ChartsPage(chartsEpinioPage);

        chartsPage.goTo();
        chartsPage.goToInstall().nextPage();

        chartsPage.tabsCountOnInstallQuestions().should('have.length.above', 3);
      });
    });
  });
});
