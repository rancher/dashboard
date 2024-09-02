import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import { exampleStorageClass, defaultStorageClass } from '@/cypress/e2e/blueprints/charts/rancher-backup-chart';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';

const STORAGE_CLASS_RESOURCE = 'storage.k8s.io.storageclasses';

describe('Charts', { tags: ['@charts', '@adminUser'] }, () => {
  describe('Rancher Backups', () => {
    const chartPage = new ChartPage();

    before(() => {
      cy.login();
      HomePagePo.goTo();
    });

    describe('Rancher Backups storage class config', () => {
      beforeEach(() => {
        cy.intercept('/v1/storage.k8s.io.storageclasses?exclude=metadata.managedFields').as('storageClasses');
        cy.intercept('/v1/persistentvolumes?exclude=metadata.managedFields').as('persistentVolumes');
        cy.intercept('/v1/secrets?exclude=metadata.managedFields').as('secrets');
        cy.createRancherResource('v1', STORAGE_CLASS_RESOURCE, JSON.stringify(defaultStorageClass));
        cy.createRancherResource('v1', STORAGE_CLASS_RESOURCE, JSON.stringify(exampleStorageClass));
      });

      afterEach(() => {
        cy.deleteRancherResource('v1', STORAGE_CLASS_RESOURCE, 'test-default-storage-class');
        cy.deleteRancherResource('v1', STORAGE_CLASS_RESOURCE, 'test-no-annotations');
      });

      it('Should auto-select default storage class', () => {
        ChartPage.navTo(null, 'Rancher Backups');
        chartPage.waitForPage('repo-type=cluster&repo=rancher-charts&chart=rancher-backup');

        const installPage = new InstallChartPage();

        chartPage.goToInstall();
        installPage.nextPage();
        cy.wait('@storageClasses', { timeout: 10000 }).its('response.statusCode').should('eq', 200);
        cy.wait('@persistentVolumes', { timeout: 10000 }).its('response.statusCode').should('eq', 200);

        installPage.waitForPage('repo-type=cluster&repo=rancher-charts&chart=rancher-backup');

        // Scroll into view - scroll to bottom of view
        cy.get('.main-layout > .outlet > .outer-container').scrollTo('bottom');

        // Select the 'Use an existing storage class' option
        const storageOptions = new RadioGroupInputPo('[chart="[chart: cluster/rancher-charts/rancher-backup]"]');

        // Check that the control exists
        storageOptions.checkExists();

        storageOptions.set(2);

        // Scroll into view - scroll to bottom of view
        cy.get('.main-layout > .outlet > .outer-container').scrollTo('bottom');

        // Verify that the drop-down exists and has the default storage class selected
        const select = new LabeledSelectPo('[data-testid="backup-chart-select-existing-storage-class"]');

        select.checkExists();
        select.checkOptionSelected('test-default-storage-class');

        // Verify that changing tabs doesn't reset the last selected storage class option
        installPage.editYaml();
        const tabbedOptions = new TabbedPo();

        installPage.editOptions(tabbedOptions, '[data-testid="button-group-child-0"]');

        select.checkExists();
        select.checkOptionSelected('test-default-storage-class');
      });
    });
  });
});
