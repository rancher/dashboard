import BannersPo from '@/cypress/e2e/po/components/banners.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import PreferencesPagePo from '@/cypress/e2e/po/pages/preferences.po';
import ReposListPagePo from '@/cypress/e2e/po/pages/repositories.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';
// import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';

const userMenu = new UserMenuPo();
const prefPage = new PreferencesPagePo();
const repoListPage = new ReposListPagePo('_', 'manager');
const repoList = repoListPage.list();
// const clusterManagerPage = new ClusterManagerListPagePo('_');

describe('User can update their preferences', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Can navigate to Preferences Page', { tags: ['@adminUser', '@standardUser', '@flaky'] }, () => {
    /*
    Open user menu and navigate to Preferences page
    Verify url includes endpoint '/prefs'
    Verify preference page title
    */
    HomePagePo.goToAndWaitForGet();
    userMenu.clickMenuItem('Preferences');
    userMenu.isClosed();
    prefPage.waitForPage();
    prefPage.checkIsCurrentPage();
    prefPage.title();
  });

  it('Can select a language', { tags: ['@adminUser', '@standardUser'] }, () => {
    /*
    Select language
    */
    const languages = {
      '[lang="en-us"]':   1,
      '[lang="zh-hans"]': 2
    };

    prefPage.goTo();
    prefPage.languageDropdownMenu().checkVisible();
    for (const [key, value] of Object.entries(languages)) {
      prefPage.languageDropdownMenu().toggle();
      prefPage.languageDropdownMenu().isOpened();
      prefPage.languageDropdownMenu().getOptions().should('have.length', 2);
      prefPage.languageDropdownMenu().clickOption(value);
      prefPage.languageDropdownMenu().isClosed();
      prefPage.checkLangDomElement(key);
    }
  });

  it('Can select a theme', { tags: ['@adminUser', '@standardUser'] }, () => {
    /*
    Select theme and verify that its highlighted
    Validate http request's payload & response contain correct values per selection
    */
    const themeOptions = {
      Light: '"ui-light"',
      Dark:  '"ui-dark"',
      Auto:  '"ui-auto"'
    };

    prefPage.goTo();
    prefPage.themeButtons().checkVisible();
    for (const [key, value] of Object.entries(themeOptions)) {
      cy.intercept('PUT', 'v1/userpreferences/*').as(`prefUpdate${ key }`);
      prefPage.themeButtons().set(key);
      cy.wait(`@prefUpdate${ key }`).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body.data).to.have.property('theme', value);
        expect(response?.body.data).to.have.property('theme', value);
      });
      prefPage.themeButtons().isSelected(key);
    }
  });

  it('Can select login landing page', { tags: '@adminUser' }, () => {
    /*
    Select each radio button and verify its highlighted
    Validate http request's payload & response contain correct values per selection
    Verify user is landing on correct page after login
    Verify selection is preserved after logout/login
    */

    const landingPageOptions = [
      {
        index: '0', value: '"home"', page: '/home'
      },
      {
        index: '1', value: '"last-visited"', page: 'c/_/manager/provisioning.cattle.io.cluster'
      },
      { // This option only works when there is an existing local cluster
        index: '2', value: '{\"name\":\"c-cluster\",\"params\":{\"cluster\":\"local\"}}', page: '/explore'
      },
    ];

    prefPage.goTo();
    prefPage.landingPageRadioBtn().checkVisible();
    landingPageOptions.forEach((key) => {
      cy.intercept('PUT', 'v1/userpreferences/*').as(`prefUpdate${ key.value }`);
      prefPage.landingPageRadioBtn().set(parseInt(key.index));
      cy.wait(`@prefUpdate${ key.value }`).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body.data).to.have.property('after-login-route', key.value);
        expect(response?.body.data).to.have.property('after-login-route', key.value);
      });
      prefPage.landingPageRadioBtn().isChecked(parseInt(key.index));

      // NOTE: Ideally we'd like to verify user is landing on correct page after login however there are issues with the login command

      // if key is 1, navigate to cluster manager page and then do validations, else just do validations
      // if (parseInt(key.index) === 1) {
      //   cy.intercept('PUT', 'v1/userpreferences/*').as('userPref');
      //   clusterManagerPage.goTo();
      //   clusterManagerPage.list().checkVisible();
      //   cy.wait('@userPref').its('response.statusCode').should('eq', 200);
      // }

    // userMenu.toggle();
    // userMenu.isOpen();
    // userMenu.clickMenuItem('Log Out');
    // cy.login();
    // cy.visit(`${ Cypress.config().baseUrl }`);
    // cy.url().should('include', value[1]);
    // prefPage.goTo();
    // prefPage.landingPageRadioBtn().isChecked(key);
    });
  });

  it('Can select date format', { tags: ['@adminUser', '@standardUser'] }, () => {
    /*
    Select each option
    Validate http request's payload & response contain correct values per selection
    */
    const dateOptions = {
      'YYYY-MM-DD':      5,
      'M/D/YYYY':        4,
      'D/M/YYYY':        3,
      'ddd, D MMM YYYY': 2,
      'ddd, MMM D YYYY': 1
    };

    prefPage.goTo();
    prefPage.dateFormateDropdownMenu().checkVisible();
    for (const [key, value] of Object.entries(dateOptions)) {
      prefPage.dateFormateDropdownMenu().toggle();
      prefPage.dateFormateDropdownMenu().isOpened();
      prefPage.dateFormateDropdownMenu().getOptions().should('have.length', 5);
      cy.intercept('PUT', 'v1/userpreferences/*').as(`prefUpdate${ key }`);
      prefPage.dateFormateDropdownMenu().clickOption(value);
      cy.wait(`@prefUpdate${ key }`).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body.data).to.have.property('date-format', key);
        expect(response?.body.data).to.have.property('date-format', key);
      });
      prefPage.dateFormateDropdownMenu().isClosed();
    }
  });

  it('Can select time format', { tags: ['@adminUser', '@standardUser'] }, () => {
    /*
    Select each option
    Validate http request's payload & response contain correct values per selection
    */
    const formatOptions = {
      'HH:mm:ss':  2,
      'h:mm:ss a': 1
    };

    prefPage.goTo();
    prefPage.timeFormateDropdownMenu().checkVisible();
    for (const [key, value] of Object.entries(formatOptions)) {
      prefPage.timeFormateDropdownMenu().toggle();
      prefPage.timeFormateDropdownMenu().isOpened();
      prefPage.timeFormateDropdownMenu().getOptions().should('have.length', 2);
      cy.intercept('PUT', 'v1/userpreferences/*').as(`prefUpdate${ key }`);
      prefPage.timeFormateDropdownMenu().clickOption(value);
      cy.wait(`@prefUpdate${ key }`).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body.data).to.have.property('time-format', key);
        expect(response?.body.data).to.have.property('time-format', key);
      });
      prefPage.timeFormateDropdownMenu().isClosed();
    }
  });

  it('Can select Table Rows per Page', { tags: ['@adminUser', '@standardUser'] }, () => {
    /*
    Select each option
    Validate http request's payload & response contain correct values per selection
    */
    const perPageOptions = {
      10:  1,
      25:  2,
      50:  3,
      100: 4
    };

    prefPage.goTo();
    prefPage.perPageDropdownMenu().checkVisible();
    for (const [key, value] of Object.entries(perPageOptions)) {
      prefPage.perPageDropdownMenu().toggle();
      prefPage.perPageDropdownMenu().isOpened();
      prefPage.perPageDropdownMenu().getOptions().should('have.length', 4);
      cy.intercept('PUT', 'v1/userpreferences/*').as(`prefUpdate${ key }`);
      prefPage.perPageDropdownMenu().clickOption(value);
      cy.wait(`@prefUpdate${ key }`).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body.data).to.have.property('per-page', key);
        expect(response?.body.data).to.have.property('per-page', key);
      });
      prefPage.perPageDropdownMenu().isClosed();
      prefPage.perPageDropdownMenu().checkOptionSelected(key);
    }
  });

  it('Can select Confirmation Setting', { tags: ['@adminUser', '@standardUser'] }, () => {
    /*
    Select the checkbox
    Validate http request's payload & response contain correct values per selection
    */
    prefPage.goTo();
    prefPage.scalingDownPromptCheckbox().checkVisible();
    cy.intercept('PUT', 'v1/userpreferences/*').as('prefUpdate');
    prefPage.scalingDownPromptCheckbox().set();
    cy.wait('@prefUpdate').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('scale-pool-prompt', 'true');
      expect(response?.body.data).to.have.property('scale-pool-prompt', 'true');
    });
    prefPage.scalingDownPromptCheckbox().isChecked();

    prefPage.scalingDownPromptCheckbox().set();
    cy.wait('@prefUpdate').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('scale-pool-prompt', 'false');
      expect(response?.body.data).to.have.property('scale-pool-prompt', 'false');
    });
    prefPage.scalingDownPromptCheckbox().isUnchecked();
  });

  it('Can select Enable "View in API"', { tags: ['@adminUser', '@standardUser'] }, () => {
    /*
    Select the checkbox and verify 'View in API' is enabled
    Deselect the checkbox and verify 'View in API' is hidden
    Validate http request's payload & response contain correct values per selection
    */
    prefPage.goTo();
    prefPage.viewInApiCheckbox().checkVisible();
    cy.intercept('PUT', 'v1/userpreferences/*').as('prefUpdate');
    prefPage.viewInApiCheckbox().set();
    cy.wait('@prefUpdate').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('view-in-api', 'true');
      expect(response?.body.data).to.have.property('view-in-api', 'true');
    });
    prefPage.viewInApiCheckbox().isChecked();

    repoListPage.waitForGoTo('/v1/catalog.cattle.io.clusterrepos?exclude=metadata.managedFields');
    repoList.actionMenu('Partners').getMenuItem('View in API').should('exist');

    prefPage.goTo();
    prefPage.viewInApiCheckbox().checkVisible();
    cy.intercept('PUT', 'v1/userpreferences/*').as('prefUpdate2');
    prefPage.viewInApiCheckbox().set();
    cy.wait('@prefUpdate2').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('view-in-api', 'false');
      expect(response?.body.data).to.have.property('view-in-api', 'false');
    });
    prefPage.viewInApiCheckbox().isUnchecked();

    repoListPage.waitForGoTo('/v1/catalog.cattle.io.clusterrepos?exclude=metadata.managedFields');
    repoList.actionMenu('Partners').getMenuItem('View in API').should('not.exist');
  });

  it('Can select Show system Namespaces managed by Rancher (not intended for editing or deletion)', { tags: ['@adminUser', '@standardUser'] }, () => {
    /*
    Select checkbox option
    Validate http request's payload & response contain correct values per selection
    */
    prefPage.goTo();
    prefPage.allNamespacesCheckbox().checkVisible();
    cy.intercept('PUT', 'v1/userpreferences/*').as('prefUpdate');
    prefPage.allNamespacesCheckbox().set();
    cy.wait('@prefUpdate').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('all-namespaces', 'true');
      expect(response?.body.data).to.have.property('all-namespaces', 'true');
    });
    prefPage.allNamespacesCheckbox().isChecked();

    prefPage.allNamespacesCheckbox().set();
    cy.wait('@prefUpdate').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('all-namespaces', 'false');
      expect(response?.body.data).to.have.property('all-namespaces', 'false');
    });
    prefPage.allNamespacesCheckbox().isUnchecked();
  });

  it('Can select Enable Dark/Light Theme keyboard shortcut toggle (shift+T)', { tags: ['@adminUser', '@standardUser'] }, () => {
    /*
    Select checkbox option
    Validate http request's payload & response contain correct values per selection
    */
    prefPage.goTo();
    prefPage.themeShortcutCheckbox().checkVisible();
    cy.intercept('PUT', 'v1/userpreferences/*').as('prefUpdate');
    prefPage.themeShortcutCheckbox().set();
    cy.wait('@prefUpdate').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('theme-shortcut', 'true');
      expect(response?.body.data).to.have.property('theme-shortcut', 'true');
    });
    prefPage.themeShortcutCheckbox().isChecked();

    prefPage.themeShortcutCheckbox().set();
    cy.wait('@prefUpdate').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('theme-shortcut', 'false');
      expect(response?.body.data).to.have.property('theme-shortcut', 'false');
    });
    prefPage.themeShortcutCheckbox().isUnchecked();
  });

  it('Can select Hide All Type Description Boxes', { tags: ['@adminUser', '@standardUser'] }, () => {
    /*
    Select the checkbox and verify description banner hidden
    Deselect the checkbox and verify description banner displays
    */
    const banners = new BannersPo('header > .banner');

    prefPage.goTo();
    prefPage.hideDescriptionsCheckbox().checkVisible();
    cy.intercept('PUT', 'v1/userpreferences/*').as('prefUpdate');
    prefPage.hideDescriptionsCheckbox().set();
    cy.wait('@prefUpdate').its('response.statusCode').should('eq', 200);
    prefPage.hideDescriptionsCheckbox().isChecked();

    repoListPage.waitForGoTo('/v1/catalog.cattle.io.clusterrepos?exclude=metadata.managedFields');
    banners.self().should('not.exist');

    prefPage.goTo();
    prefPage.hideDescriptionsCheckbox().checkVisible();
    cy.intercept('PUT', 'v1/userpreferences/*').as('prefUpdate2');
    prefPage.hideDescriptionsCheckbox().set();
    cy.wait('@prefUpdate2').its('response.statusCode').should('eq', 200);
    prefPage.hideDescriptionsCheckbox().isUnchecked();

    repoListPage.waitForGoTo('/v1/catalog.cattle.io.clusterrepos?exclude=metadata.managedFields');
    banners.self().should('exist');
  });

  it('Can select a YAML Editor Key Mapping option', { tags: ['@adminUser', '@standardUser'] }, () => {
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
    prefPage.keymapButtons().checkVisible();
    for (const [key, value] of Object.entries(buttonOptions)) {
      cy.intercept('PUT', 'v1/userpreferences/*').as(`prefUpdate${ key }`);
      prefPage.keymapButtons().set(key);
      cy.wait(`@prefUpdate${ key }`).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body.data).to.have.property('keymap', value);
        expect(response?.body.data).to.have.property('keymap', value);
      });
      prefPage.keymapButtons().isSelected(key);
    }
  });

  it('Can select a Helm Charts option', { tags: ['@adminUser', '@standardUser'] }, () => {
    /*
    Select Helm Charts mapping option
    Validate http request's payload & response contain correct values per selection
    */
    const buttonOptions = {
      'Include Prerelease Versions': 'true',
      'Show Releases Only':          'false'
    };

    prefPage.goTo();
    prefPage.helmButtons().checkVisible();
    for (const [key, value] of Object.entries(buttonOptions)) {
      cy.intercept('PUT', 'v1/userpreferences/*').as(`prefUpdate${ key }`);
      prefPage.helmButtons().set(key);
      cy.wait(`@prefUpdate${ key }`).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body.data).to.have.property('show-pre-release', value);
        expect(response?.body.data).to.have.property('show-pre-release', value);
      });
      prefPage.helmButtons().isSelected(key);
    }
  });
});
