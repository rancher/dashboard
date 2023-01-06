import ExtensionsPo from '@/cypress/e2e/po/pages/extensions.po';

const extensionName = 'homepage';

describe('Extensions page', () => {
  before(() => {
    cy.login();

    ExtensionsPo.goTo();
    const extensionsPo = new ExtensionsPo();

    // install extensions operator if it's not installed
    extensionsPo.installExtensionsOperatorIfNeeded();

    // install the rancher plugin examples
    extensionsPo.installRancherPluginExamples();
  });

  beforeEach(() => {
    cy.login();
    ExtensionsPo.goTo();
  });

  // it('Should disable and enable extension support', () => {
  //   const extensionsPo = new ExtensionsPo();

  //   // open menu and click on disable extension support
  //   extensionsPo.extensionMenuToggle();
  //   extensionsPo.disableExtensionsClick();

  //   // on the modal, keep the extensions repo and click disable
  //   extensionsPo.removeRancherExtRepoCheckboxClick();
  //   extensionsPo.disableExtensionModalDisableClick();

  //   // let's wait for the install button to become visible and re-install
  //   // the extensions operator
  //   extensionsPo.installOperatorBtn().should('be.visible');
  //   extensionsPo.installOperatorBtnClick();
  //   extensionsPo.enableExtensionModalEnableClick();

  //   // wait for operation to finish and refresh...
  //   extensionsPo.extensionTabs().should('be.visible');
  //   ExtensionsPo.goTo();

  //   // let's make sure all went good
  //   extensionsPo.extensionTabAvailableClick();
  //   extensionsPo.extensionCard(extensionName).should('be.visible');
  // });

  // it('Should toogle the extension details', () => {
  //   const extensionsPo = new ExtensionsPo();

  //   extensionsPo.extensionTabAvailableClick();

  //   // we should be on the extensions page
  //   extensionsPo.title().should('contain', 'Extensions');

  //   // show extension details
  //   extensionsPo.extensionCardClick(extensionName);

  //   // after card click, we should get the info slide in panel
  //   extensionsPo.extensionDetails().should('be.visible');
  //   extensionsPo.extensionDetailsTitle().should('contain', extensionName);

  //   // close the details on the cross icon X
  //   extensionsPo.extensionDetailsCloseClick();
  //   extensionsPo.extensionDetails().should('not.be.visible');

  //   // show extension details again...
  //   extensionsPo.extensionCardClick(extensionName);
  //   extensionsPo.extensionDetails().should('be.visible');

  //   // clicking outside the details tab should also close it
  //   extensionsPo.extensionDetailsBgClick();
  //   extensionsPo.extensionDetails().should('not.be.visible');
  // });

  // it('Should install an extension', () => {
  //   const extensionsPo = new ExtensionsPo();

  //   extensionsPo.extensionTabAvailableClick();

  //   // click on install button on card
  //   extensionsPo.extensionCardInstallClick(extensionName);
  //   extensionsPo.extensionInstallModal().should('be.visible');

  //   // select version and click install
  //   extensionsPo.installModalSelectVersionClick(2);
  //   extensionsPo.installModalInstallClick();

  //   // let's check the extension reload banner and reload the page
  //   extensionsPo.extensionReloadBanner().should('be.visible');
  //   extensionsPo.extensionReloadClick();

  //   // make sure extension card is in the installed tab
  //   extensionsPo.extensionTabInstalledClick();
  //   extensionsPo.extensionCardClick(extensionName);
  //   extensionsPo.extensionDetailsTitle().should('contain', extensionName);
  //   extensionsPo.extensionDetailsCloseClick();
  // });

  // it('Should update an extension version', () => {
  //   const extensionsPo = new ExtensionsPo();

  //   extensionsPo.extensionTabInstalledClick();

  //   // click on update button on card
  //   extensionsPo.extensionCardUpdateClick(extensionName);
  //   extensionsPo.installModalInstallClick();

  //   // let's check the extension reload banner and reload the page
  //   extensionsPo.extensionReloadBanner().should('be.visible');
  //   extensionsPo.extensionReloadClick();

  //   // make sure extension card is not available anymore on the updates tab
  //   // since we installed the latest version
  //   extensionsPo.extensionTabUpdatesClick();
  //   extensionsPo.extensionCard(extensionName).should('not.exist');
  // });

  // it('Should rollback an extension version', () => {
  //   const extensionsPo = new ExtensionsPo();

  //   extensionsPo.extensionTabInstalledClick();

  //   // click on the rollback button on card
  //   // this will rollback to the immediate previous version
  //   extensionsPo.extensionCardRollbackClick(extensionName);
  //   extensionsPo.installModalInstallClick();

  //   // let's check the extension reload banner and reload the page
  //   extensionsPo.extensionReloadBanner().should('be.visible');
  //   extensionsPo.extensionReloadClick();

  //   // make sure extension card is on the updates tab
  //   extensionsPo.extensionTabUpdatesClick();
  //   extensionsPo.extensionCard(extensionName).should('be.visible');
  // });

  // it('Should uninstall an extension', () => {
  //   const extensionsPo = new ExtensionsPo();

  //   extensionsPo.extensionTabInstalledClick();

  //   // click on uninstall button on card
  //   extensionsPo.extensionCardUninstallClick(extensionName);
  //   extensionsPo.extensionUninstallModal().should('be.visible');
  //   extensionsPo.uninstallModaluninstallClick();

  //   // // let's check the extension reload banner and reload the page
  //   extensionsPo.extensionReloadBanner().should('be.visible');
  //   extensionsPo.extensionReloadClick();

  //   // // make sure extension card is in the available tab
  //   extensionsPo.extensionTabAvailableClick();
  //   extensionsPo.extensionCardClick(extensionName);
  //   extensionsPo.extensionDetailsTitle().should('contain', extensionName);
  // });
});
