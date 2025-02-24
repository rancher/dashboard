import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import AboutPagePo from '@/cypress/e2e/po/pages/about.po';
import PreferencesPagePo from '@/cypress/e2e/po/pages/preferences.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';
import AccountPagePo from '@/cypress/e2e/po/pages/account-api-keys.po';
import CreateKeyPagePo from '@/cypress/e2e/po/pages/account-api-keys-create_key.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import CardPo from '@/cypress/e2e/po/components/card.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import { WorkloadsDeploymentsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';
import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import { SettingsPagePo } from '@/cypress/e2e/po/pages/global-settings/settings.po';
import PodSecurityAdmissionsPagePo from '@/cypress/e2e/po/pages/cluster-manager/pod-security-admissions.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import { HomeLinksPagePo } from '@/cypress/e2e/po/pages/global-settings/home-links.po';
import ChartRepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';

describe('Shell a11y testing', { tags: ['@adminUser', '@accessibility'] }, () => {
  describe('Login page', () => {
    it('login page', () => {
      const loginPage = new LoginPagePo();

      loginPage.goTo();
      loginPage.waitForPage();
      cy.injectAxe();
      loginPage.username().set('test user');

      cy.checkPageAccessibility();
    });

    it('locale selector', () => {
      const loginPage = new LoginPagePo();

      loginPage.goTo();
      loginPage.waitForPage();
      cy.injectAxe();
      loginPage.localSelector().click();
      cy.checkPageAccessibility();
    });
  });

  describe('Logged in', { testIsolation: 'off' }, () => {
    const aboutPage = new AboutPagePo();
    const prefPage = new PreferencesPagePo();
    const userMenu = new UserMenuPo();

    before(() => {
      cy.login();
      cy.updateNamespaceFilter('local', 'none', '{"local":[]}');
    });

    it('Home page', () => {
      HomePagePo.goToAndWaitForGet();
      cy.injectAxe();

      cy.checkPageAccessibility();
    });

    it('About page', () => {
      AboutPagePo.navTo();
      aboutPage.waitForPage();
      cy.injectAxe();

      cy.checkPageAccessibility();
    });

    it('Preferences page', () => {
      userMenu.clickMenuItem('Preferences');
      userMenu.isClosed();
      prefPage.waitForPage();
      cy.injectAxe();

      cy.checkPageAccessibility();
    });

    describe('Accounts', () => {
      const accountPage = new AccountPagePo();
      const createKeyPage = new CreateKeyPagePo();

      it('Account', () => {
        accountPage.goTo();
        accountPage.waitForPage();
        accountPage.title();
        cy.injectAxe();

        cy.checkPageAccessibility();
      });

      it('Change password dialog', () => {
        accountPage.changePassword();
        accountPage.currentPassword().checkVisible();
        cy.injectAxe();

        accountPage.changePasswordModal().then((el) => {
          cy.checkElementAccessibility(el);
        });

        accountPage.cancel();
      });

      it('Create API key', () => {
        accountPage.create();
        createKeyPage.waitForPage();
        createKeyPage.mastheadTitle().then((el) => {
          expect(el.trim()).to.include('API Key');
        });
        cy.injectAxe();

        cy.checkPageAccessibility();
      });
    });

    describe('Cluster Dashboard', () => {
      const clusterDashboard = new ClusterDashboardPagePo('local');

      it('Cluster dashboard page', () => {
        ClusterDashboardPagePo.navTo();
        clusterDashboard.waitForPage();
        cy.injectAxe();

        cy.checkPageAccessibility();
      });

      it('Cluster appearance dialog', () => {
        clusterDashboard.customizeAppearanceButton().click();

        const customClusterCard = new CardPo();

        customClusterCard.getTitle().contains('Cluster Appearance');
        cy.injectAxe();

        customClusterCard.self().then((el: any) => {
          cy.checkElementAccessibility(el);
        });

        customClusterCard.getActionButton().contains('Cancel').click();
      });
    });

    describe('Cluster Management', () => {
      it('Clusters - Create page', () => {
        const createClusterPage = new ClusterManagerCreatePagePo();
        const loadingPo = new LoadingPo('.loading-indicator');

        createClusterPage.goTo();
        createClusterPage.waitForPage();
        loadingPo.checkNotExists();

        createClusterPage.rkeToggle().checkVisible();
        cy.injectAxe();

        cy.checkPageAccessibility();

        cy.injectAxe();

        // check rke toggle
        createClusterPage.rkeToggle().get('.switch').then((el) => {
          cy.checkElementAccessibility(el);
        });
      });

      it('Pod Security Admissions - Create page', () => {
        const podSecurityAdmissionsPage = new PodSecurityAdmissionsPagePo();

        PodSecurityAdmissionsPagePo.navTo();
        podSecurityAdmissionsPage.waitForPage();
        podSecurityAdmissionsPage.create();
        podSecurityAdmissionsPage.createPodSecurityAdmissionForm().waitForPage();
        // trigger error banner with invalid resource name `AAA`
        podSecurityAdmissionsPage.createPodSecurityAdmissionForm().nameNsDescription().name().set('AAA');
        podSecurityAdmissionsPage.createPodSecurityAdmissionForm().resourceDetail().cruResource().saveOrCreate()
          .click();
        const banner = new BannersPo('[data-testid="error-banner0"]');

        banner.checkVisible();
        cy.injectAxe();

        cy.checkPageAccessibility();
      });

      it('Repositories - Create page', () => {
        const repositoriesPage = new ChartRepositoriesPagePo(undefined, 'manager');

        ChartRepositoriesPagePo.navTo();
        repositoriesPage.waitForPage();
        repositoriesPage.create();
        repositoriesPage.createEditRepositories().waitForPage();
        repositoriesPage.createEditRepositories().lablesAnnotationsKeyValue().addButton('Add Label').click();

        // Adding Annotations doesn't work via test automation
        // See https://github.com/rancher/dashboard/issues/13191
        // repositoriesPage.createEditRepositories().lablesAnnotationsKeyValue().addButton('Add Annotation').click();
        cy.injectAxe();

        cy.checkPageAccessibility();
      });
    });

    it('Deployments page', () => {
      const deploymentsListPage = new WorkloadsDeploymentsListPagePo();

      deploymentsListPage.goTo();
      deploymentsListPage.waitForPage();
      deploymentsListPage.sortableTable().checkLoadingIndicatorNotVisible();
      // expand the health scale up/down control
      deploymentsListPage.sortableTable().getTableCell(1, 10).click();
      cy.injectAxe();

      cy.checkPageAccessibility();
    });

    it('Charts page', () => {
      const chartsPage = new ChartsPage();

      ChartsPage.navTo();
      chartsPage.waitForPage();
      chartsPage.chartsCarouselSlides().should('be.visible');
      cy.injectAxe();

      cy.checkPageAccessibility();
    });

    it('Extensions page', () => {
      const extensionsPo = new ExtensionsPagePo();

      // Set the preference
      cy.setUserPreference({ 'plugin-developer': true });

      extensionsPo.goTo();
      extensionsPo.waitForPage(null, 'available');
      extensionsPo.loading().should('not.exist');
      extensionsPo.extensionTabBuiltin().checkExists();
      extensionsPo.extensionTabBuiltinClick();
      extensionsPo.waitForPage(null, 'builtin');
      extensionsPo.extensionCard('aks').should('be.visible');
      cy.injectAxe();

      cy.checkPageAccessibility();
    });

    it('Global Settings page', () => {
      const settingsPage = new SettingsPagePo('local');

      SettingsPagePo.navTo();
      settingsPage.waitForPage();
      cy.injectAxe();

      cy.checkPageAccessibility();

      // expand menu
      settingsPage.actionButtonByLabel('engine-install-url').click();
      settingsPage.editSettingsButton().should('be.visible');
      cy.injectAxe();

      settingsPage.editSettingsButton().then((el) => {
        cy.checkElementAccessibility(el);
      });
    });

    it('Home Links page', () => {
      const homeLinksPage = new HomeLinksPagePo();

      HomeLinksPagePo.navTo();
      homeLinksPage.addLinkButton().click();
      homeLinksPage.displayTextInput().checkVisible();
      homeLinksPage.urlInput().checkVisible();
      cy.injectAxe();

      cy.checkPageAccessibility();
    });
  });

  describe('Menus', { testIsolation: 'off' }, () => {
    const homePage = new HomePagePo();
    const burgerMenu = new BurgerMenuPo();
    const userMenu = new UserMenuPo();

    before(() => {
      cy.login();
    });

    it('User Menu', () => {
      HomePagePo.navTo();
      homePage.waitForPage();
      userMenu.ensureOpen();
      cy.injectAxe();

      userMenu.userMenuContainer().then((el: any) => {
        cy.checkElementAccessibility(el);
      });
    });

    it('Burger Menu', () => {
      HomePagePo.navTo();
      homePage.waitForPage();
      burgerMenu.checkVisible();
      BurgerMenuPo.toggle();
      cy.injectAxe();

      burgerMenu.self().then((el: any) => {
        cy.checkElementAccessibility(el);
      });

      burgerMenu.brandLogoImage().then((el: any) => {
        cy.checkElementAccessibility(el);
      });
    });

    it('Product Side navigation', () => {
      const clusterDashboard = new ClusterDashboardPagePo('local');

      clusterDashboard.goTo();
      clusterDashboard.waitForPage();
      cy.injectAxe();

      const sideNav = new ProductNavPo();

      const sideNavOptions = ['Cluster', 'Workloads', 'Apps', 'Service Discovery', 'Storage', 'Policy', 'More Resources'];

      // expand each side nav option and check accessibility
      sideNavOptions.forEach((option) => {
        sideNav.navToSideMenuGroupByLabel(option);
        sideNav.self().then((el: any) => {
          cy.checkElementAccessibility(el);
        });
      });
    });
  });

  after(() => {
    cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
    cy.setUserPreference({ 'plugin-developer': false });
  });
});
