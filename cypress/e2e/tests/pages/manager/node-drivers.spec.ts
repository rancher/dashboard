import { isMatch } from 'lodash';
import NodeDriverListPagePo from '@/cypress/e2e/po/pages/cluster-manager/drivers/node-driver-list.po';
import NodeDriverEditPo from '~/cypress/e2e/po/edit/nodeDriver.po';
import DeactivateDriverDialogPo from '@/cypress/e2e/po/dialog/DeactivateDriverDialog.po';
const type = 'nodeDriver';
const name = 'https://github.com/cloud-ca/docker-machine-driver-cloudca/files/2294176/docker-machine-driver-cloudca_v1.0.3_linux-amd64.zip'; // description can be used as name to find correct element

describe('Node Drivers', () => {
  const driverList = new NodeDriverListPagePo('local');
  const createDriverPage = new NodeDriverEditPo('local');

  beforeEach(() => {
    cy.login();
    driverList.goTo();
  });
  it('should show the node drivers list page', () => {
    cy.contains('.title > h1', 'Node Drivers').should('be.visible');
    driverList.sortableTable().checkVisible();

    // Wait for loading indicator to go
    driverList.sortableTable().checkLoadingIndicatorNotVisible();
  });
  it('can create new driver', () => {
    cy.intercept('POST', `/v3/nodedrivers`).as('createRequest');
    const request = {
      type,
      active: true,
      url:    'https://github.com/cloud-ca/docker-machine-driver-cloudca/files/2294176/docker-machine-driver-cloudca_v1.0.3_linux-amd64.zip',
      uiUrl:  'https://test.com'
    };

    driverList.createDriver();

    createDriverPage.waitForPage();
    createDriverPage.enterUrl('https://github.com/cloud-ca/docker-machine-driver-cloudca/files/2294176/docker-machine-driver-cloudca_v1.0.3_linux-amd64.zip');
    createDriverPage.enterUiUrl('https://test.com');

    createDriverPage.create();

    cy.wait('@createRequest').then((intercept) => {
      expect(isMatch(intercept.request.body, request)).to.equal(true);
    });
  });
  it('can deactivate driver', () => {
    const request = { };

    driverList.listElementWithName(name).find('.col-link-detail span').invoke('text').then((t) => {
      cy.intercept('POST', `/v3/nodeDrivers/${ t }?action=deactivate`).as('createRequest');

      driverList.list().actionMenu(name).getMenuItem('Deactivate').click();
      const deactivateDialog = new DeactivateDriverDialogPo('local');

      deactivateDialog.deactivate();
    });
    cy.wait('@createRequest').then((intercept) => {
      expect(isMatch(intercept.request.body, request)).to.equal(true);
    });
  });

  after(() => {
    driverList.goTo();
    driverList.sortableTable().deleteItemWithUI('https://github.com/cloud-ca/docker-machine-driver-cloudca/files/2294176/docker-machine-driver-cloudca_v1.0.3_linux-amd64.zip');
  });
});
