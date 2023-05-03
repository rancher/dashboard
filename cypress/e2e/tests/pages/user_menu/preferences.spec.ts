import HomePagePo from '~/cypress/e2e/po/pages/home.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';
import PreferencesPagePo from '@/cypress/e2e/po/pages/preferences.po';
import BannersPo from '~/cypress/e2e/po/components/banners.po';
import ReposListPagePo from '~/cypress/e2e/po/pages/cluster-manager/advanced/repositories.po';
import AppRepoListPo from '~/cypress/e2e/po/lists/catalog.cattle.io.clusterrepo.po';
import ClusterManagerListPagePo from '~/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';

const userMenu = new UserMenuPo();
const prefPage = new PreferencesPagePo();
const repoList = new AppRepoListPo('tr');

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
    Select language and verify its preserved after page reload
    */
    const languages = {
      '[lang="en-us"]':   1,
      '[lang="zh-hans"]': 2
    };

    prefPage.goTo();
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
      cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
        if (req?.body?.data?.['theme'] === value[0]) {
          req.alias = `prefUpdate${ key }`;
        }
      });
      prefPage.themeButtons().set(key);
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
    Validate http request's payload & response contain correct values per selection
    Verify user is landing on correct page after login
    Verify selection is preserved after logout/login
    */
    const landingPageOptions = {
      0: ['"home"', '/home'],
      1: ['"last-visited"', 'c/_/manager/provisioning.cattle.io.cluster'],
      // 2: ['{\"name\":\"c-cluster\",\"params\":{\"cluster\":\"local\"}}', '/explore'] // TODO this option only works when there is an existing cluster (not for standard user)
    };

    for (const [key, value] of Object.entries(landingPageOptions)) {
      prefPage.goTo();
      cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
        if (req?.body?.data?.['after-login-route'] === value[0]) {
          req.alias = `prefUpdate${ key }`;
        }
      });
      prefPage.landingPageRadioBtn().set(key);
      cy.wait(`@prefUpdate${ key }`).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body.data).to.have.property('after-login-route', value[0]);
        expect(response?.body.data).to.have.property('after-login-route', value[0]);
      });
      prefPage.landingPageRadioBtn().isChecked(key);

      // if key is 1, navigate to cluster manager page and then do validations, else just do validations
      if (key == 1) {
        cy.intercept('GET', '/v3/clusters').as('clusters');
        ClusterManagerListPagePo.goTo('_');
        cy.wait('@clusters').its('response.statusCode').should('eq', 200);
      }

      userMenu.toggle();
      userMenu.isOpen();
      userMenu.clickMenuItem('Log Out');
      cy.login();
      cy.visit(Cypress.config().baseUrl);
      cy.url().should('include', value[1]);
      prefPage.goTo();
      prefPage.landingPageRadioBtn().isChecked(key);
    }
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
    for (const [key, value] of Object.entries(dateOptions)) {
      prefPage.dateFormateDropdownMenu().toggle();
      prefPage.dateFormateDropdownMenu().isOpened();
      prefPage.dateFormateDropdownMenu().getOptions().should('have.length', 5);
      cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
        if (req?.body?.data?.['date-format'] === key) {
          req.alias = `prefUpdate${ key }`;
        }
      });
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
    for (const [key, value] of Object.entries(formatOptions)) {
      prefPage.timeFormateDropdownMenu().toggle();
      prefPage.timeFormateDropdownMenu().isOpened();
      prefPage.timeFormateDropdownMenu().getOptions().should('have.length', 2);
      cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
        if (req?.body?.data?.['time-format'] === key) {
          req.alias = `prefUpdate${ key }`;
        }
      });
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
    for (const [key, value] of Object.entries(perPageOptions)) {
      prefPage.perPageDropdownMenu().toggle();
      prefPage.perPageDropdownMenu().isOpened();
      prefPage.perPageDropdownMenu().getOptions().should('have.length', 4);
      cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
        if (req?.body?.data?.['per-page'] === key) {
          req.alias = `prefUpdate${ key }`;
        }
      });
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
    for (const [key, value] of Object.entries(clustersOptions)) {
      prefPage.clustersDropdownMenu().toggle();
      prefPage.clustersDropdownMenu().isOpened();
      prefPage.clustersDropdownMenu().getOptions().should('have.length', 9);
      cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
        if (req?.body?.data?.['menu-max-clusters'] === key) {
          req.alias = `prefUpdate${ key }`;
        }
      });
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
    cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
      if (req?.body?.data?.['scale-pool-prompt'] === 'true') {
        req.alias = 'prefUpdate';
      }
    });
    prefPage.scalingDownPromptCheckbox().set();
    cy.wait('@prefUpdate').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('scale-pool-prompt', 'true');
      expect(response?.body.data).to.have.property('scale-pool-prompt', 'true');
    });
    prefPage.scalingDownPromptCheckbox().isChecked();

    cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
      if (req?.body?.data?.['scale-pool-prompt'] === 'false') {
        req.alias = 'prefUpdate';
      }
    });
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
    cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
      if (req?.body?.data?.['view-in-api'] === 'true') {
        req.alias = 'prefUpdate';
      }
    });
    prefPage.viewInApiCheckbox().set();
    cy.wait('@prefUpdate').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('view-in-api', 'true');
      expect(response?.body.data).to.have.property('view-in-api', 'true');
    });
    prefPage.viewInApiCheckbox().isChecked();

    cy.intercept('GET', '/v1/catalog.cattle.io.clusterrepos').as('clusterRepos');
    ReposListPagePo.goTo('_');
    cy.wait('@clusterRepos').its('response.statusCode').should('eq', 200);
    repoList.actionMenu('Partners').getMenuItem('View in API').should('exist');

    prefPage.goTo();
    cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
      if (req?.body?.data?.['view-in-api'] === 'false') {
        req.alias = 'prefUpdate2';
      }
    });
    prefPage.viewInApiCheckbox().set();
    cy.wait('@prefUpdate2').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('view-in-api', 'false');
      expect(response?.body.data).to.have.property('view-in-api', 'false');
    });
    prefPage.viewInApiCheckbox().isUnchecked();

    ReposListPagePo.goTo('_');
    cy.wait('@clusterRepos').its('response.statusCode').should('eq', 200);
    repoList.actionMenu('Partners').getMenuItem('View in API').should('not.exist');
  });

  it('Can select Show system Namespaces managed by Rancher (not intended for editing or deletion)', () => {
    /*
    Select checkbox option
    Validate http request's payload & response contain correct values per selection
    */
    prefPage.goTo();
    cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
      if (req?.body?.data?.['all-namespaces'] === 'true') {
        req.alias = 'prefUpdate';
      }
    });
    prefPage.allNamespacesCheckbox().set();
    cy.wait('@prefUpdate').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('all-namespaces', 'true');
      expect(response?.body.data).to.have.property('all-namespaces', 'true');
    });
    prefPage.allNamespacesCheckbox().isChecked();

    cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
      if (req?.body?.data?.['all-namespaces'] === 'false') {
        req.alias = 'prefUpdate';
      }
    });
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
    cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
      if (req?.body?.data?.['theme-shortcut'] === 'true') {
        req.alias = 'prefUpdate';
      }
    });
    prefPage.themeShortcutCheckbox().set();
    cy.wait('@prefUpdate').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.data).to.have.property('theme-shortcut', 'true');
      expect(response?.body.data).to.have.property('theme-shortcut', 'true');
    });
    prefPage.themeShortcutCheckbox().isChecked();

    cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
      if (req?.body?.data?.['theme-shortcut'] === 'false') {
        req.alias = 'prefUpdate';
      }
    });
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
    cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
      if (req?.body?.data?.['hide-desc'] === '["ALL"]') {
        req.alias = 'prefUpdate';
      }
    });
    prefPage.hideDescriptionsCheckbox().set();
    cy.wait('@prefUpdate').its('response.statusCode').should('eq', 200);
    prefPage.hideDescriptionsCheckbox().isChecked();

    ReposListPagePo.goTo('_');
    banners.self().should('not.exist');

    prefPage.goTo();
    cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
      if (req?.body?.data?.['hide-desc'] === '[]') {
        req.alias = 'prefUpdate2';
      }
    });
    prefPage.hideDescriptionsCheckbox().set();
    cy.wait('@prefUpdate2').its('response.statusCode').should('eq', 200);
    prefPage.hideDescriptionsCheckbox().isUnchecked();

    ReposListPagePo.goTo('_');
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
      cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
        if (req?.body?.data?.['keymap'] === value) {
          req.alias = `prefUpdate${ key }`;
        }
      });
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
    for (const [key, value] of Object.entries(buttonOptions)) {
      cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
        if (req?.body?.data?.['show-pre-release'] === value) {
          req.alias = `prefUpdate${ key }`;
        }
      });
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
