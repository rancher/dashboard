import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import ReposListPagePo from '@/cypress/e2e/po/pages/repositories.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

const EXTENSION_NAME = 'clock';
const UI_PLUGINS_PARTNERS_REPO_URL = 'https://github.com/rancher/partner-extensions';
const UI_PLUGINS_PARTNERS_REPO_NAME = 'partner-extensions';

describe('Extensions page', { tags: '@adminUser' }, () => {
  before(() => {
    cy.login();

    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();

    // install extensions operator if it's not installed
    extensionsPo.installExtensionsOperatorIfNeeded();

    // install the rancher plugin examples
    extensionsPo.addExtensionsRepository('https://github.com/rancher/ui-plugin-examples', 'main', 'rancher-plugin-examples');
  });

  beforeEach(() => {
    cy.login();
  });

  it('using "Add Rancher Repositories" should add a new repository (Partners repo)', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    // go to "add rancher repositories"
    extensionsPo.extensionMenuToggle();
    extensionsPo.addRepositoriesClick();

    // add the partners repo
    extensionsPo.addReposModalAddClick();
    extensionsPo.addReposModal().should('not.exist');

    // go to repos list page
    const appRepoList = new ReposListPagePo('local', 'apps');

    appRepoList.goTo();
    appRepoList.waitForPage();
    appRepoList.sortableTable().rowElementWithName(UI_PLUGINS_PARTNERS_REPO_URL).should('exist');
  });

  it('Should disable and enable extension support', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    // open menu and click on disable extension support
    extensionsPo.extensionMenuToggle();
    extensionsPo.disableExtensionsClick();

    // on the modal, keep the extensions repo and click disable
    extensionsPo.disableExtensionModalDisableClick();

    // let's wait for the install button to become visible and re-install
    // the extensions operator
    extensionsPo.installOperatorBtn().checkVisible();
    extensionsPo.installOperatorBtn().click();
    extensionsPo.enableExtensionModalEnableClick();

    // wait for operation to finish and refresh...
    extensionsPo.extensionTabs.checkVisible();
    extensionsPo.goTo();
    extensionsPo.waitForPage();

    // let's make sure all went good
    extensionsPo.extensionTabAvailableClick();
    extensionsPo.extensionCard(EXTENSION_NAME).should('be.visible');
  });

  it('New repos banner should only appear once (after dismiss should NOT appear again)', () => {
    cy.getRancherResource('v3', 'setting', 'display-add-extension-repos-banner', null).then((resp: Cypress.Response<any>) => {
      const notFound = resp.status === 404;
      const requiredValue = resp.body?.value === 'true';

      if (notFound || requiredValue) {
        cy.log('Good test state', '/v3/setting/display-add-extension-repos-banner', resp.status, JSON.stringify(resp?.body || {}));
      } else {
        cy.log('Bad test state', '/v3/setting/display-add-extension-repos-banner', resp.status, JSON.stringify(resp?.body || {}));

        return cy.setRancherResource('v3', 'setting', 'display-add-extension-repos-banner', {
          ...resp.body,
          value: 'true'
        });
      }
    });

    const appRepoList = new ReposListPagePo('local', 'apps');

    // Ensure that the banner should be shown (by confirming that a required repo isn't there)
    appRepoList.goTo();
    appRepoList.waitForPage();
    appRepoList.sortableTable().noRowsShouldNotExist();
    appRepoList.sortableTable().rowNames().then((names) => {
      if (names.includes(UI_PLUGINS_PARTNERS_REPO_NAME)) {
        appRepoList.list().actionMenu(UI_PLUGINS_PARTNERS_REPO_NAME).getMenuItem('Delete').click();
        const promptRemove = new PromptRemove();

        return promptRemove.remove();
      }
    });

    // Now go to extensions (by nav, not page load....)
    appRepoList.navToMenuEntry('Extensions');

    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.waitForPage();
    extensionsPo.loading().should('not.exist');

    extensionsPo.repoBanner().checkVisible();
    extensionsPo.repoBanner().self().find('[data-testid="extensions-new-repos-banner-action-btn"]').click();
    extensionsPo.repoBanner().checkNotExists();

    // let's refresh the page to make sure it doesn't appear again...
    extensionsPo.goTo();
    extensionsPo.waitForPage();
    extensionsPo.waitForTitle();
    extensionsPo.loading().should('not.exist');
    extensionsPo.repoBanner().checkNotExists();
  });

  it('Should toggle the extension details', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabAvailableClick();

    // we should be on the extensions page
    extensionsPo.waitForTitle();

    // show extension details
    extensionsPo.extensionCardClick(EXTENSION_NAME);

    // after card click, we should get the info slide in panel
    extensionsPo.extensionDetails().should('be.visible');
    extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);

    // close the details on the cross icon X
    extensionsPo.extensionDetailsCloseClick();
    extensionsPo.extensionDetails().should('not.be.visible');

    // show extension details again...
    extensionsPo.extensionCardClick(EXTENSION_NAME);
    extensionsPo.extensionDetails().should('be.visible');

    // clicking outside the details tab should also close it
    extensionsPo.extensionDetailsBgClick();
    extensionsPo.extensionDetails().should('not.be.visible');
  });

  it('Should install an extension', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabAvailableClick();

    // click on install button on card
    extensionsPo.extensionCardInstallClick(EXTENSION_NAME);
    extensionsPo.extensionInstallModal().should('be.visible');

    // select version and click install
    extensionsPo.installModalSelectVersionClick(2);
    extensionsPo.installModalInstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the installed tab
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.extensionCardClick(EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
    extensionsPo.extensionDetailsCloseClick();
  });

  it('Should update an extension version', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabInstalledClick();

    // click on update button on card
    extensionsPo.extensionCardUpdateClick(EXTENSION_NAME);
    extensionsPo.installModalInstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is not available anymore on the updates tab
    // since we installed the latest version
    extensionsPo.extensionTabUpdatesClick();
    extensionsPo.extensionCard(EXTENSION_NAME).should('not.exist');
  });

  it('Should rollback an extension version', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabInstalledClick();

    // click on the rollback button on card
    // this will rollback to the immediate previous version
    extensionsPo.extensionCardRollbackClick(EXTENSION_NAME);
    extensionsPo.installModalInstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is on the updates tab
    extensionsPo.extensionTabUpdatesClick();
    extensionsPo.extensionCard(EXTENSION_NAME).should('be.visible');
  });

  it('Should uninstall an extension', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabInstalledClick();

    // click on uninstall button on card
    extensionsPo.extensionCardUninstallClick(EXTENSION_NAME);
    extensionsPo.extensionUninstallModal().should('be.visible');
    extensionsPo.uninstallModaluninstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the available tab
    extensionsPo.extensionTabAvailableClick();
    extensionsPo.extensionCardClick(EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
  });
});
