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
import { EventsCreateEditPo, EventsPageListPo } from '@/cypress/e2e/po/pages/explorer/events.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import { ProjectsNamespacesListPagePo, NamespaceCreateEditPagePo, ProjectCreateEditPagePo } from '@/cypress/e2e/po/pages/explorer/projects-namespaces.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import { dialogModal, promptModal } from '@/cypress/e2e/po/prompts/shared/modalInstances.po';
import ClusterToolsPagePo from '@/cypress/e2e/po/pages/explorer/cluster-tools.po';
import { WorkLoadsDaemonsetsCreatePagePo, WorkloadsDaemonsetsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-daemonsets.po';
import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { SecretsCreateEditPo, SecretsListPagePo } from '@/cypress/e2e/po/pages/explorer/secrets.po';
import SlideInPo from '@/cypress/e2e/po/side-bars/slide-in.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import DigitalOceanCloudCredentialsCreateEditPo from '@/cypress/e2e/po/edit/cloud-credentials-digitalocean.po';
import KontainerDriversPagePo from '@/cypress/e2e/po/pages/cluster-manager/kontainer-drivers.po';
import UsersPo from '@/cypress/e2e/po/pages/users-and-auth/users.po';
import UserRetentionPo from '@/cypress/e2e/po/pages/users-and-auth/user.retention.po';
import ResourceSearchDialog from '@/cypress/e2e/po/prompts/ResourceSearchDialog.po';
import { StorageClassesPagePo } from '@/cypress/e2e/po/pages/explorer/storage-classes.po';
import { BrandingPagePo } from '@/cypress/e2e/po/pages/global-settings/branding.po';
import { BannersPagePo } from '@/cypress/e2e/po/pages/global-settings/banners.po';
import { USERS_BASE_URL } from '@/cypress/support/utils/api-endpoints';
import { FleetApplicationCreatePo, FleetGitRepoCreateEditPo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.application.po';

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

    it('Fleet GitRepo - Add Repository page', () => {
      const appBundleCreatePage = new FleetApplicationCreatePo();
      const gitRepoCreatePage = new FleetGitRepoCreateEditPo();

      appBundleCreatePage.goTo();
      appBundleCreatePage.waitForPage();

      appBundleCreatePage.createGitRepo();
      gitRepoCreatePage.waitForPage();
      gitRepoCreatePage.resourceDetail().createEditView().nameNsDescription()
        .name()
        .checkVisible();

      cy.injectAxe();

      cy.checkPageAccessibility();
    });

    describe('Account and API Keys', () => {
      const accountPage = new AccountPagePo();
      const createKeyPage = new CreateKeyPagePo();

      it('Account and API Keys Page', () => {
        accountPage.goTo();
        accountPage.waitForPage();
        accountPage.title();
        cy.injectAxe();

        cy.checkPageAccessibility();
      });

      it('Change Password dialog', () => {
        accountPage.changePassword();
        accountPage.currentPassword().checkVisible();
        cy.injectAxe();

        accountPage.changePasswordModal().then((el) => {
          cy.checkElementAccessibility(el);
        });

        promptModal().clickActionButton('Cancel');
      });

      it('API Key - Create', () => {
        accountPage.create();
        createKeyPage.waitForPage();
        createKeyPage.mastheadTitle().then((title) => {
          expect(title.replace(/\s+/g, ' ')).to.contain('API Key: Create');
        });
        cy.injectAxe();

        cy.checkPageAccessibility();

        createKeyPage.cancel();
        accountPage.waitForPage();
      });

      it('API Key - Delete', () => {
        accountPage.title();
        accountPage.list().resourceTable().sortableTable().selectAllCheckbox()
          .set();
        accountPage.list().resourceTable().sortableTable().deleteButton()
          .click();
        cy.injectAxe();

        cy.checkPageAccessibility();
      });
    });

    describe('Explorer', () => {
      describe('Cluster', () => {
        const clusterDashboard = new ClusterDashboardPagePo('local');

        it('Cluster Dashboard page', () => {
          clusterDashboard.goTo();
          clusterDashboard.waitForPage();
          cy.injectAxe();

          cy.checkPageAccessibility();
        });

        it('Cluster Appearance Modal', () => {
          clusterDashboard.customizeAppearanceButton().click();

          const customClusterCard = new CardPo();

          customClusterCard.getTitle().contains('Cluster Appearance');
          cy.injectAxe();

          customClusterCard.self().then((el: any) => {
            cy.checkElementAccessibility(el);
          });

          promptModal().clickActionButton('Cancel');
        });

        describe('Projects-Namespaces', () => {
          const projectsNamespacesPage = new ProjectsNamespacesListPagePo();
          const createProjectPage = new ProjectCreateEditPagePo();
          const createNamespacePage = new NamespaceCreateEditPagePo();

          it('Projects-Namespaces - Move dialog', () => {
            ProjectsNamespacesListPagePo.navTo();
            projectsNamespacesPage.waitForPage();
            projectsNamespacesPage.list().resourceTable().sortableTable().rowActionMenuOpen('cattle-fleet-system')
              .getMenuItem('Move')
              .click();

            cy.injectAxe();

            promptModal().self().then((el) => {
              cy.checkElementAccessibility(el);
            });

            promptModal().clickActionButton('Cancel');
          });

          it('Projects-Namespaces - Delete Project dialog', () => {
            projectsNamespacesPage.waitForPage();
            projectsNamespacesPage.list().resourceTable().sortableTable().groupByButtons(1)
              .click();
            projectsNamespacesPage.list().resourceTable().sortableTable().rowActionMenuOpen('Project: Default')
              .getMenuItem('Delete')
              .click();

            const promptRemove = new PromptRemove();

            cy.injectAxe();

            promptRemove.self().then((el) => {
              cy.checkElementAccessibility(el);
            });

            promptRemove.cancel();
          });

          it('Projects-Namespaces - Create Project', () => {
            projectsNamespacesPage.waitForPage();
            projectsNamespacesPage.baseResourceList().masthead().create();
            projectsNamespacesPage.mastheadTitle().then((title) => {
              expect(title.replace(/\s+/g, ' ')).to.contain('Project: Create');
            });
            createProjectPage.waitForPage(null, 'members');
            createProjectPage.resourceDetail().createEditView()
              .nameNsDescription()
              .name()
              .checkVisible();
            cy.injectAxe();

            cy.checkPageAccessibility();
          });

          it('Projects-Namespaces - Add Project Member', () => {
            createProjectPage.goTo();
            createProjectPage.waitForPage();
            createProjectPage.addProjectMemberButton().should('be.visible');
            createProjectPage.addProjectMemberButton().click();
            promptModal().getBody().should('be.visible');

            cy.injectAxe();

            promptModal().self().then((el) => {
              cy.checkElementAccessibility(el);
            });

            promptModal().clickActionButton('Cancel');

            createProjectPage.resourceDetail().cruResource()
              .cancel()
              .click();
          });

          it('Projects-Namespaces - Create Namespace', () => {
            projectsNamespacesPage.waitForPage();
            projectsNamespacesPage.list().resourceTable().sortableTable().groupByButtons(0)
              .click();
            projectsNamespacesPage.createNamespaceButton().should('be.visible').click();
            projectsNamespacesPage.mastheadTitle().then((title) => {
              expect(title.replace(/\s+/g, ' ')).to.contain('Namespace: Create');
            });
            createNamespacePage.waitForPage('flatView=true', 'container-resource-limit');
            createNamespacePage.resourceDetail().createEditView()
              .nameNsDescription()
              .name()
              .checkVisible();
            cy.injectAxe();

            cy.checkPageAccessibility();

            createNamespacePage.resourceDetail().cruResource()
              .cancel()
              .click();
          });

          it('Projects-Namespaces Page', () => {
            projectsNamespacesPage.waitForPage();
            projectsNamespacesPage.list().masthead().title().should('contain', 'Projects/Namespaces');

            cy.injectAxe();

            cy.checkPageAccessibility();
          });
        });

        describe('Tools', () => {
          it('Cluster Tools Page', () => {
            const clusterTools = new ClusterToolsPagePo('local');

            ClusterToolsPagePo.navTo();
            clusterTools.waitForPage();
            clusterTools.featureChartCards().should('be.visible');
            cy.injectAxe();

            cy.checkPageAccessibility();
          });
        });

        describe('Events', () => {
          const events = new EventsPageListPo('local');

          it('Cluster events page', () => {
            EventsPageListPo.navTo();
            events.waitForPage();
            events.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();

            cy.injectAxe();

            cy.checkPageAccessibility();
          });

          it('Create event from YAML', () => {
            const createEventPage = new EventsCreateEditPo();

            EventsPageListPo.navTo();
            events.waitForPage();
            events.baseResourceList().masthead().createYaml();
            createEventPage.waitForPage('as=yaml');
            events.mastheadTitle().then((title) => {
              expect(title.replace(/\s+/g, ' ')).to.contain('Event: Create');
            });
            createEventPage.resourceDetail().resourceYaml()
              .codeMirror()
              .checkExists();

            cy.injectAxe();

            cy.checkPageAccessibility();

            createEventPage.resourceDetail().resourceYaml()
              .cancel();
          });
        });
      });

      describe('Workloads', () => {
        it('Deployments page', () => {
          const deploymentsListPage = new WorkloadsDeploymentsListPagePo();

          deploymentsListPage.goTo();
          deploymentsListPage.waitForPage();
          deploymentsListPage.sortableTable().checkLoadingIndicatorNotVisible();
          cy.injectAxe();

          cy.checkPageAccessibility();
        });

        it('DeamonSets - Create', () => {
          const daemonsetsListPage = new WorkloadsDaemonsetsListPagePo();
          const daemonsetsCreatePage = new WorkLoadsDaemonsetsCreatePagePo('local');

          daemonsetsListPage.goTo();
          daemonsetsListPage.waitForPage();
          daemonsetsListPage.baseResourceList().masthead().create();
          daemonsetsCreatePage.waitForPage();
          daemonsetsCreatePage.resourceDetail().createEditView().nameNsDescription()
            .name()
            .checkVisible();

          cy.injectAxe();

          cy.checkPageAccessibility();
          daemonsetsCreatePage.resourceDetail().cruResource()
            .cancel()
            .click();
        });
      });

      describe('Storage', () => {
        it('Secret - Create page', () => {
          const secretsListPage = new SecretsListPagePo('local');
          const secretsCreatePage = new SecretsCreateEditPo('local');

          SecretsListPagePo.navTo();
          secretsListPage.waitForPage();
          secretsListPage.createButton().click();
          secretsCreatePage.waitForPage();
          secretsCreatePage.mastheadTitle().then((title) => {
            expect(title.replace(/\s+/g, ' ')).to.contain('Secret: Create');
          });
          secretsCreatePage.resourceDetail().cruResource().findSubTypeByName('custom')
            .should('be.visible');

          cy.injectAxe();

          cy.checkPageAccessibility();
        });

        it('Secret - Describe Resource', () => {
          const header = new HeaderPo();
          const slideIn = new SlideInPo();

          header.kubectlExplain().click();

          slideIn.checkVisible();
          slideIn.waitforContent();

          cy.injectAxe();

          cy.checkPageAccessibility();

          slideIn.closeButton().click();
          slideIn.checkNotVisible();
        });

        it('Storage Class - Create', () => {
          const storageClasses = new StorageClassesPagePo();

          storageClasses.goTo();
          storageClasses.waitForPage();
          storageClasses.clickCreate();
          storageClasses.createStorageClassesForm().waitForPage(null, 'parameters');
          storageClasses.mastheadTitle().then((title) => {
            expect(title.replace(/\s+/g, ' ')).to.contain('StorageClass: Create');
          });
          cy.injectAxe();

          cy.checkPageAccessibility();
        });
      });

      describe('Header', () => {
        const header = new HeaderPo();

        it('Import YAML', () => {
          const clusterDashboard = new ClusterDashboardPagePo('local');

          ClusterDashboardPagePo.navTo();
          clusterDashboard.waitForPage();
          header.importYamlHeaderAction().click();
          header.importYaml().checkVisible();

          cy.injectAxe();

          header.importYaml().self().then((el: any) => {
            cy.checkElementAccessibility(el);
          });

          header.importYaml().importYamlCancelClick();
          header.importYaml().checkNotExists();
        });

        it('Kubectl Shell', () => {
          header.kubectlShell().openTerminal();
          header.kubectlShell().waitForTerminalToBeVisible();

          cy.injectAxe();

          header.kubectlShell().self().then((el: any) => {
            cy.checkElementAccessibility(el);
          });

          header.kubectlShell().closeTerminal();
        });

        it('Resource Search', () => {
          const dialog = new ResourceSearchDialog();

          header.resourceSearchButton().click();
          dialog.searchBox().should('be.visible');

          cy.injectAxe();

          dialog.self().then((el: any) => {
            cy.checkElementAccessibility(el);
          });

          dialog.close();
          dialog.checkNotExists();
        });
      });
    });

    describe('Cluster Management', () => {
      const createClusterPage = new ClusterManagerCreatePagePo();
      const loadingPo = new LoadingPo('.loading-indicator');

      it('Clusters - Create page', () => {
        createClusterPage.goTo();
        createClusterPage.waitForPage();
        loadingPo.checkNotExists();

        cy.injectAxe();

        cy.checkPageAccessibility();

        cy.injectAxe();
      });

      it('Cluster - Create Digital Ocean Cloud Credential', () => {
        const clusterList = new ClusterManagerListPagePo();

        ClusterManagerListPagePo.navTo();
        clusterList.waitForPage();
        clusterList.createCluster();
        createClusterPage.selectCreate(2);
        loadingPo.checkNotExists();
        createClusterPage.rke2PageTitle().should('include', 'Create DigitalOcean');
        createClusterPage.waitForPage('type=digitalocean&rkeType=rke2');
        cy.injectAxe();

        cy.checkPageAccessibility();
      });

      it('Cluster - Create Digital Ocean', () => {
        const cloudCredForm = new DigitalOceanCloudCredentialsCreateEditPo();

        // fake cloud credential authentication
        cy.intercept('GET', '/meta/proxy/api.digitalocean.com/v2/regions?per_page=1000', (req) => {
          req.reply({ statusCode: 200 });
        }).as('doCloudCred');

        // create fake cloud credential
        cloudCredForm.credentialName().set('doCloudCredName');
        cloudCredForm.accessToken().set('fakeToken');
        cloudCredForm.saveCreateForm().cruResource().saveOrCreate().click();
        cy.wait('@doCloudCred');

        createClusterPage.waitForPage('type=digitalocean&rkeType=rke2', 'basic');
        createClusterPage.rke2PageTitle().should('include', 'Create DigitalOcean');

        cy.injectAxe();

        cy.checkPageAccessibility();

        // delete digital ocean cloud credential
        cy.getRancherResource('v3', 'cloudcredentials', null, null).then((resp: Cypress.Response<any>) => {
          const body = resp.body;

          if (body.pagination['total'] > 0) {
            body.data.forEach((item: any) => {
              if (item.digitaloceancredentialConfig) {
                const id = item.id;

                cy.deleteRancherResource('v3', 'cloudcredentials', id);
              }
            });
          }
        });
      });

      it('Cluster drivers page', () => {
        const driversPage = new KontainerDriversPagePo();

        KontainerDriversPagePo.navTo();
        driversPage.waitForPage();
        driversPage.list().masthead().title().should('contain', 'Cluster Drivers');
        driversPage.list().resourceTable().sortableTable().checkVisible();
        driversPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();

        cy.injectAxe();

        cy.checkPageAccessibility();
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

    describe('Users', () => {
      const usersPo = new UsersPo('_');

      it('Users page', () => {
        cy.intercept('GET', `${ USERS_BASE_URL }?*`).as('getUsers');

        usersPo.goTo();
        usersPo.waitForPage();
        usersPo.list().masthead().title().should('contain', 'Users');
        cy.wait('@getUsers');
        usersPo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
        usersPo.list().refreshGroupMembership().checkVisible();
        cy.injectAxe();

        cy.checkPageAccessibility();
      });

      it('Users - Create page', () => {
        const userCreate = usersPo.createEdit();

        usersPo.list().masthead().create();
        userCreate.waitForPage();
        userCreate.mastheadTitle().then((title) => {
          expect(title.replace(/\s+/g, ' ')).to.contain('User: Create');
        });
        userCreate.username().checkVisible();
        cy.injectAxe();

        cy.checkPageAccessibility();

        userCreate.resourceDetail().cruResource().cancel()
          .click();
        usersPo.waitForPage();
      });

      it('User Retention Settings', () => {
        const userRetentionPo = new UserRetentionPo();

        usersPo.userRetentionLink().click();
        userRetentionPo.waitForPage();
        userRetentionPo.disableAfterPeriodCheckbox().checkVisible();

        cy.injectAxe();

        cy.checkPageAccessibility();
      });
    });

    describe('Charts', () => {
      it('Charts page', () => {
        const chartsPage = new ChartsPage();

        ChartsPage.navTo();
        chartsPage.waitForPage();
        cy.injectAxe();

        cy.checkPageAccessibility();
      });

      it('Chart Detail Page - Kubecost', () => {
        const chartPage = new ChartPage();

        ChartPage.navTo(null, 'Kubecost');
        chartPage.waitForChartPage('rancher-partner-charts', 'cost-analyzer');
        chartPage.waitForChartHeader('Kubecost', MEDIUM_TIMEOUT_OPT);

        cy.injectAxe();

        cy.checkPageAccessibility();
      });
    });

    describe('Extensions', () => {
      const extensionsPo = new ExtensionsPagePo();

      it('Extensions page', () => {
        // Set the preference
        cy.setUserPreference({ 'plugin-developer': true });

        extensionsPo.goTo();
        extensionsPo.waitForPage(null, 'available');
        extensionsPo.loading().should('not.exist');
        extensionsPo.extensionTabBuiltinClick();
        extensionsPo.waitForPage(null, 'builtin');
        extensionsPo.extensionCard('AKS Provisioning').checkVisible();
        cy.injectAxe();

        cy.checkPageAccessibility();
      });

      it('Add Rancher Repositories Modal', () => {
        extensionsPo.extensionMenuToggle();
        extensionsPo.addRepositoriesClick();
        dialogModal().checkVisible();

        cy.injectAxe();

        dialogModal().self().then((el) => {
          cy.checkElementAccessibility(el);
        });

        dialogModal().clickActionButton('Cancel');
      });

      it('Import Extension Catalog Modal', () => {
        extensionsPo.extensionMenuToggle();
        extensionsPo.manageExtensionCatalogsClick();
        extensionsPo.catalogsList().sortableTable()
          .bulkActionButton('Import Extension Catalog')
          .click();
        dialogModal().checkVisible();

        cy.injectAxe();

        dialogModal().self().then((el) => {
          cy.checkElementAccessibility(el);
        });

        dialogModal().clickActionButton('Cancel');
      });
    });

    describe('Global Settings', () => {
      it('Settings page', () => {
        const settingsPage = new SettingsPagePo('local');

        SettingsPagePo.navTo();
        settingsPage.waitForPage();
        cy.injectAxe();

        cy.checkPageAccessibility();

        // expand menu
        settingsPage.actionButtonByLabel('agent-tls-mode').click();
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

      it('Branding page', () => {
        const brandingPage = new BrandingPagePo();

        BrandingPagePo.navTo();
        brandingPage.privateLabel().checkVisible();
        cy.injectAxe();

        cy.checkPageAccessibility();
      });

      it('Banners page', () => {
        const bannersPage = new BannersPagePo();

        BannersPagePo.navTo();
        bannersPage.headerBannerCheckbox().checkVisible();
        cy.injectAxe();

        cy.checkPageAccessibility();
      });
    });

    describe('Menus', () => {
      const burgerMenu = new BurgerMenuPo();

      it('User Menu', () => {
        const userMenu = new UserMenuPo();

        userMenu.ensureOpen();
        cy.injectAxe();

        userMenu.userMenuContainer().then((el: any) => {
          cy.checkElementAccessibility(el);
        });
      });

      it('Burger Menu', () => {
        // HomePagePo.navTo();
        // homePage.waitForPage();
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
  });

  after(() => {
    cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
    cy.setUserPreference({ 'plugin-developer': false });
  });
});
