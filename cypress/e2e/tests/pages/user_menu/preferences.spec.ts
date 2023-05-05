import HomePagePo from '~/cypress/e2e/po/pages/home.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';
import PreferencesPagePo from '@/cypress/e2e/po/pages/preferences.po';
import BannersPo from '~/cypress/e2e/po/components/banners.po';
import ReposListPagePo from '~/cypress/e2e/po/pages/repositories.po';
import RepoListPo from '~/cypress/e2e/po/lists/catalog.cattle.io.clusterrepo.po';

const userMenu = new UserMenuPo();
const prefPage = new PreferencesPagePo();
const repoList = new RepoListPo('tr');
const repoListPage = new ReposListPagePo('_', 'manager');

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
    userMenu.checkVisible();
    userMenu.toggle();
    userMenu.isOpen();
    userMenu.clickMenuItem('Preferences');
    userMenu.isClosed();
    prefPage.waitForPage();
    prefPage.checkIsCurrentPage();
    prefPage.title();
  });

  it('Can select a language', () => {
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

  it('Can select a theme', () => {
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

  it('Can select login landing page', () => {
    /*
    Select each radio button and verify its highlighted
    Validate http request's payload & response contain correct values per selection
    Verify user is landing on correct page after login
    Verify selection is preserved after logout/login
    */
    prefPage.goTo();
    prefPage.landingPageRadioBtn().checkVisible();

    cy.intercept('PUT', 'v1/userpreferences/*').as('prefUpdate');
    prefPage.landingPageRadioBtn().set(0);
    cy.wait('@prefUpdate').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('after-login-route', '"home"');
      expect(response?.body.data).to.have.property('after-login-route', '"home"');
    });
    prefPage.landingPageRadioBtn().isChecked(0);

    prefPage.landingPageRadioBtn().set(1);
    cy.wait('@prefUpdate').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('after-login-route', '"last-visited"');
      expect(response?.body.data).to.have.property('after-login-route', '"last-visited"');
    });
    prefPage.landingPageRadioBtn().isChecked(1);
  });

  it('Can select date format', () => {
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

  it('Can select time format', () => {
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

  it('Can select Table Rows per Page', () => {
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

  it('Can select Number of clusters to show in side menu ', () => {
    /*
    Select each option
    Validate http request's payload & response contain correct values per selection
    */
    const clustersOptions = {
      2:  1,
      3:  2,
      4:  3,
      5:  4,
      6:  5,
      7:  6,
      8:  7,
      9:  8,
      10: 9
    };

    prefPage.goTo();
    prefPage.checkVisible();
    for (const [key, value] of Object.entries(clustersOptions)) {
      prefPage.clustersDropdownMenu().toggle();
      prefPage.clustersDropdownMenu().isOpened();
      prefPage.clustersDropdownMenu().getOptions().should('have.length', 9);
      cy.intercept('PUT', 'v1/userpreferences/*').as(`prefUpdate${ key }`);
      prefPage.clustersDropdownMenu().clickOption(value);
      cy.wait(`@prefUpdate${ key }`).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body.data).to.have.property('menu-max-clusters', key);
        expect(response?.body.data).to.have.property('menu-max-clusters', key);
      });
      prefPage.clustersDropdownMenu().isClosed();
      prefPage.clustersDropdownMenu().checkOptionSelected(key);
    }
  });

  it('Can select Confirmation Setting', () => {
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

  it('Can select Enable "View in API"', () => {
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

    repoListPage.waitForGoTo('/v1/catalog.cattle.io.clusterrepos');
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

    repoListPage.waitForGoTo('/v1/catalog.cattle.io.clusterrepos');
    repoList.actionMenu('Partners').getMenuItem('View in API').should('not.exist');
  });

  it('Can select Show system Namespaces managed by Rancher (not intended for editing or deletion)', () => {
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

  it('Can select Enable Dark/Light Theme keyboard shortcut toggle (shift+T)', () => {
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

  it('Can select Hide All Type Description Boxes', () => {
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

    repoListPage.waitForGoTo('/v1/catalog.cattle.io.clusterrepos');
    banners.self().should('not.exist');

    prefPage.goTo();
    prefPage.hideDescriptionsCheckbox().checkVisible();
    cy.intercept('PUT', 'v1/userpreferences/*').as('prefUpdate2');
    prefPage.hideDescriptionsCheckbox().set();
    cy.wait('@prefUpdate2').its('response.statusCode').should('eq', 200);
    prefPage.hideDescriptionsCheckbox().isUnchecked();

    repoListPage.waitForGoTo('/v1/catalog.cattle.io.clusterrepos');
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

  it('Can select a Helm Charts option', () => {
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
