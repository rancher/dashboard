import HomePagePo from '~/cypress/e2e/po/pages/home.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';
import PreferencesPagePo from '@/cypress/e2e/po/pages/preferences.po';
import PagePo from '~/cypress/e2e/po/pages/page.po';
import ClusterRepoListPo from '~/cypress/e2e/po/lists/catalog.cattle.io.clusterrepo.po';
import BannersPo from '~/cypress/e2e/po/components/banners.po';

const userMenu = new UserMenuPo();
const prefPage = new PreferencesPagePo();
const repoList = new ClusterRepoListPo('tr');

describe('Standard user can update their preferences', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Can navigate to Preferences Page', () => {
    /*
    Open user menu and navigate to Preferences page
    Verify url includes endpoint '/prefs'
    Verify preference page title
    */
    HomePagePo.goTo();
    userMenu.open();
    userMenu.checkOpen();
    userMenu.clickMenuLink('Preferences');
    userMenu.checkClosed();
    prefPage.waitForPage();
    prefPage.checkIsCurrentPage();
    prefPage.title();
  });

  it('Can select a language', () => {
    /*
    Select language and verify its preserved after page reload
    */
    const languages = {
      简体中文:    '[lang="zh-hans"]',
      English: '[lang="en-us"]'
    };

    prefPage.goTo();
    for (const [key, value] of Object.entries(languages)) {
      prefPage.languageDropdownMenu().open();
      prefPage.listBox().isOpened();
      prefPage.listBox().getListBoxItems().should('have.length', 2);
      prefPage.listBox().set(key);
      prefPage.languageDropdownMenu().checkOptionSelected(key);
      prefPage.listBox().isClosed();
      prefPage.checkLangDomElement(value);
      cy.reload();
      prefPage.languageDropdownMenu().checkOptionSelected(key);
      prefPage.checkLangDomElement(value);
    }
  });

  it('Can select a theme', () => {
    /*
    Select theme and verify that its highlighted
    Validate http request's payload & response contain correct values per selection
    */
    const themeOptions = {
      Light: ['"ui-light"', 'theme-light'],
      Dark:  ['"ui-dark"', 'theme-dark'],
      Auto:  ['"ui-auto"', '']
    };
    // Set theme for 'Auto' mode based on time of day
    const hour = new Date().getHours();

    for (const key in themeOptions) {
      (key === 'Auto' && hour < 7 || hour >= 18) ? themeOptions['Auto'][1] = 'theme-dark' : themeOptions['Auto'][1] = 'theme-light';
    }

    for (const [key, value] of Object.entries(themeOptions)) {
      prefPage.goTo();
      prefPage.waitForPage();
      prefPage.themeButtons().set(key);
      cy.intercept('PUT', 'v1/userpreferences/*').as(`prefUpdate${ key }`);
      cy.wait(`@prefUpdate${ key }`).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body.data).to.have.property('theme', value[0]);
        expect(response?.body.data).to.have.property('theme', value[0]);
      });
      prefPage.themeButtons().isSelected(key);
      prefPage.checkThemeDomElement(value[1]);
    }
  });

  it('Can select login landing page', () => {
    /*
    Select each radio button and verify its highlighted
    Verify user is landing on correct page after login
    Verify selection is preserved after logout/login
    */
    const landingPageOptions: {[key: number]: string} = {
      0: '/home',
      1: 'c/_/manager/provisioning.cattle.io.cluster',
      // 2: '/explore' // TODO this option only works when there is an existing cluster (not for standard user)
    };

    for (const [key, value] of Object.entries(landingPageOptions)) {
      prefPage.goTo();
      prefPage.radioButton().set(key);
      prefPage.radioButton().isChecked(key);

      // if key is 1, navigate to cluster manager page and then do validations, else just do validations
      if (key == 1) {
        cy.intercept('GET', '/v3/clusters').as('clusters');
        PagePo.goTo('c/_/manager/provisioning.cattle.io.cluster');
        cy.wait('@clusters').its('response.statusCode').should('eq', 200);
      }

      userMenu.open();
      userMenu.checkOpen();
      userMenu.clickMenuLink('Log Out');
      cy.login();
      cy.visit(Cypress.config().baseUrl);
      cy.url().should('include', value);
      prefPage.goTo();
      prefPage.radioButton().isChecked(key);
    }
  });

  it('Can select date format', () => {
    /*
    Select each option
    Validate http request's payload & response contain correct values per selection
    */
    const formats = ['YYYY-MM-DD', 'M/D/YYYY', 'D/M/YYYY', 'ddd, D MMM YYYY', 'ddd, MMM D YYYY'];

    prefPage.goTo();
    prefPage.dateFormateDropdownMenu().open();
    prefPage.listBox().isOpened();
    prefPage.listBox().getListBoxItems().should('have.length', 5).then(($els) => {
      const map = Cypress.$.map($els, el => el.innerText.trim()).reverse();

      for (const i in map) {
        prefPage.listBox().set(map[i]);
        prefPage.listBox().isClosed();
        cy.intercept('PUT', 'v1/userpreferences/*').as(`prefUpdate${ i }`);
        cy.wait(`@prefUpdate${ i }`).then(({ request, response }) => {
          expect(response?.statusCode).to.eq(200);
          expect(request.body.data).to.have.property('date-format', formats[i]);
          expect(response?.body.data).to.have.property('date-format', formats[i]);
        });
        prefPage.dateFormateDropdownMenu().open();
        prefPage.listBox().isOpened();
      }
    });
  });

  it('Can select time format', () => {
    /*
    Select each option
    Validate http request's payload & response contain correct values per selection
    */
    const formats = ['HH:mm:ss', 'h:mm:ss a'];

    prefPage.goTo();
    prefPage.timeFormateDropdownMenu().open();
    prefPage.listBox().isOpened();
    prefPage.listBox().getListBoxItems().should('have.length', 2).then(($els) => {
      const map = Cypress.$.map($els, el => el.innerText.trim()).reverse();

      for (const i in map) {
        prefPage.listBox().set(map[i]);
        prefPage.listBox().isClosed();
        cy.intercept('PUT', 'v1/userpreferences/*').as(`prefUpdate${ i }`);
        cy.wait(`@prefUpdate${ i }`).then(({ request, response }) => {
          expect(response?.statusCode).to.eq(200);
          expect(request.body.data).to.have.property('time-format', formats[i]);
          expect(response?.body.data).to.have.property('time-format', formats[i]);
        });
        prefPage.timeFormateDropdownMenu().open();
        prefPage.listBox().isOpened();
      }
    });
  });

  it('Can select Table Rows per Page', () => {
    /*
    Select each option
    Validate http request's payload & response contain correct values per selection
    */
    const options = ['25', '50', '100', '10'];

    prefPage.goTo();
    for (const i in options) {
      prefPage.perPageDropdownMenu().open();
      prefPage.listBox().isOpened();
      prefPage.listBox().getListBoxItems().should('have.length', 4);
      prefPage.listBox().set(options[i]);
      prefPage.listBox().isClosed();
      prefPage.perPageDropdownMenu().checkOptionSelected(options[i]);
      cy.intercept('PUT', 'v1/userpreferences/*').as(`prefUpdate${ i }`);
      cy.wait(`@prefUpdate${ i }`).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body.data).to.have.property('per-page', options[i]);
        expect(response?.body.data).to.have.property('per-page', options[i]);
      });
    }
  });

  it('Can select Number of clusters to show in side menu ', () => {
    /*
    Select each option
    Validate http request's payload & response contain correct values per selection
    */
    const options = ['2', '3', '4', '5', '6', '7', '8', '9', '10'];

    prefPage.goTo();
    for (const i in options) {
      prefPage.clustersDropdownMenu().open();
      prefPage.listBox().isOpened();
      prefPage.listBox().getListBoxItems().should('have.length', 9);
      prefPage.listBox().set(options[i]);
      prefPage.listBox().isClosed();
      prefPage.clustersDropdownMenu().checkOptionSelected(options[i]);
      cy.intercept('PUT', 'v1/userpreferences/*').as(`prefUpdate${ i }`);
      cy.wait(`@prefUpdate${ i }`).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body.data).to.have.property('menu-max-clusters', options[i]);
        expect(response?.body.data).to.have.property('menu-max-clusters', options[i]);
      });
    }
  });

  it('Can select Confirmation Setting', () => {
    /*
    Select the checkbox and verify state is preserved after logout/login
    */
    const checkboxLabel = 'Do not ask for confirmation when scaling down node pools.';

    prefPage.goTo();
    prefPage.checkbox(checkboxLabel).set();
    prefPage.checkbox(checkboxLabel).isChecked();
    userMenu.open();
    userMenu.checkOpen();
    userMenu.clickMenuLink('Log Out');
    cy.login();
    prefPage.goTo();
    prefPage.checkbox(checkboxLabel).set();
    prefPage.checkbox(checkboxLabel).isUnchecked();
  });

  it('Can select Enable "View in API"', () => {
    /*
    Select the checkbox and verify 'View in API' is enabled
    Deselect the checkbox and verify 'View in API' is hidden
    */
    const clusterRepoEndpoint = 'c/_/manager/catalog.cattle.io.clusterrepo';

    prefPage.goTo();
    const checkboxLabel = 'Enable "View in API"';

    prefPage.checkbox(checkboxLabel).set();
    prefPage.checkbox(checkboxLabel).isChecked();

    cy.intercept('GET', '/v1/catalog.cattle.io.clusterrepos').as('clusterRepos');
    PagePo.goTo(clusterRepoEndpoint);
    cy.wait('@clusterRepos').its('response.statusCode').should('eq', 200);
    repoList.actionMenu('Partners').getMenuItem('View in API').should('exist');

    prefPage.goTo();
    prefPage.checkbox(checkboxLabel).set();
    prefPage.checkbox(checkboxLabel).isUnchecked();

    PagePo.goTo(clusterRepoEndpoint);
    cy.wait('@clusterRepos').its('response.statusCode').should('eq', 200);
    repoList.actionMenu('Partners').getMenuItem('View in API').should('not.exist');
  });

  it('Can select Show system Namespaces managed by Rancher (not intended for editing or deletion)', () => {
    /*
    Select checkbox option and verify state is preserved after logout/login
    */
    prefPage.goTo();
    const checkboxLabel = 'Show system Namespaces managed by Rancher (not intended for editing or deletion)';

    prefPage.checkbox(checkboxLabel).set();
    prefPage.checkbox(checkboxLabel).isChecked();
    userMenu.open();
    userMenu.checkOpen();
    userMenu.clickMenuLink('Log Out');
    cy.login();
    prefPage.goTo();
    prefPage.checkbox(checkboxLabel).isChecked();
    prefPage.checkbox(checkboxLabel).set();
    prefPage.checkbox(checkboxLabel).isUnchecked();
  });

  it('Can select Enable Dark/Light Theme keyboard shortcut toggle (shift+T)', () => {
    /*
    Select checkbox option and verify state is preserved after logout/login
    */
    prefPage.goTo();
    const checkboxLabel = 'Enable Dark/Light Theme keyboard shortcut toggle (shift+T)';

    prefPage.checkbox(checkboxLabel).set();
    prefPage.checkbox(checkboxLabel).isChecked();
    userMenu.open();
    userMenu.checkOpen();
    userMenu.clickMenuLink('Log Out');
    cy.login();
    prefPage.goTo();
    prefPage.checkbox(checkboxLabel).isChecked();
    prefPage.checkbox(checkboxLabel).set();
    prefPage.checkbox(checkboxLabel).isUnchecked();
  });

  it('Can select Hide All Type Description Boxes', () => {
    /*
    Select the checkbox and verify description banner hidden
    Deselect the checkbox and verify description banner displays
    */
    const banners = new BannersPo('header > .banner');
    const clusterRepoEndpoint = 'c/_/manager/catalog.cattle.io.clusterrepo';
    const checkboxLabel = 'Hide All Type Descriptions';

    prefPage.goTo();
    prefPage.checkbox(checkboxLabel).set();
    prefPage.checkbox(checkboxLabel).isChecked();
    cy.intercept('PUT', 'v1/userpreferences/*').as('prefUpdate');
    cy.wait('@prefUpdate').its('response.statusCode').should('eq', 200);

    PagePo.goTo(clusterRepoEndpoint);
    banners.self().should('not.exist');

    prefPage.goTo();
    prefPage.checkbox(checkboxLabel).set();
    prefPage.checkbox(checkboxLabel).isUnchecked();
    cy.intercept('PUT', 'v1/userpreferences/*').as('prefUpdate2');
    cy.wait('@prefUpdate2').its('response.statusCode').should('eq', 200);

    PagePo.goTo(clusterRepoEndpoint);
    banners.self().should('exist');
  });

  it('Can select a YAML Editor Key Mapping option', () => {
    /*
    Select key mapping option
    Validate http request's payload & response contain correct values per selection
    */
    const buttonOptions = {
      'Normal human': 'sublime',
      Emacs:          'emacs',
      Vim:            'vim',
    };

    prefPage.goTo();
    for (const [key, value] of Object.entries(buttonOptions)) {
      prefPage.keymapButtons().set(key);
      cy.intercept('PUT', 'v1/userpreferences/*').as(`prefUpdate${ key }`);
      cy.wait(`@prefUpdate${ key }`).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body.data).to.have.property('keymap', value);
        expect(response?.body.data).to.have.property('keymap', value);
      });
      prefPage.keymapButtons().isSelected(key);
    }
  });

  it('Can select a Helm Charts option', () => {
    /*
    Select Helm Charts mapping option
    Validate http request's payload & response contain correct values per selection
    */
    const buttonOptions = {
      'Include Prerelease Versions': 'true',
      'Show Releases Only':          'false'
    };

    for (const [key, value] of Object.entries(buttonOptions)) {
      prefPage.goTo();
      prefPage.helmButtons().set(key);
      cy.intercept('PUT', 'v1/userpreferences/*').as(`prefUpdate${ key }`);
      cy.wait(`@prefUpdate${ key }`).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body.data).to.have.property('show-pre-release', value);
        expect(response?.body.data).to.have.property('show-pre-release', value);
      });
      prefPage.helmButtons().isSelected(key);
    }
  });
});
