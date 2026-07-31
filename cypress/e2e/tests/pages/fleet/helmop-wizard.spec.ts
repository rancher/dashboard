import { FleetApplicationCreatePo, FleetApplicationListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.application.po';
import { FleetHelmOpCreateEditPo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.helmop.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';

// Covers issue https://github.com/rancher/dashboard/issues/14546
// "HelmOp wizard - edit/view/create" - related change:
// https://github.com/rancher/dashboard/pull/13886
//
// Exercises the HelmOp create wizard end to end, then the read-only view of the
// created resource, then editing it - the create/view/edit lifecycle.

const workspace = 'fleet-default';
const chart = {
  name:       'redis',
  repository: 'https://charts.bitnami.com/bitnami',
  version:    '24.0.0'
};

const helmOpsToDelete: string[] = [];

describe('Fleet HelmOp wizard create, view and edit', { testIsolation: false, tags: ['@fleet', '@adminUser'] }, () => {
  const createPage = new FleetApplicationCreatePo();
  const listPage = new FleetApplicationListPagePo();
  const headerPo = new HeaderPo();

  let helmOpName: string;

  before(() => {
    cy.login();
    cy.createE2EResourceName('helmop-wizard').then((name) => {
      helmOpName = name;
    });
  });

  it('creates a HelmOp through the wizard', () => {
    cy.intercept('POST', '/v1/fleet.cattle.io.helmops').as('createHelmOp');

    createPage.goTo();
    createPage.waitForPage();
    createPage.createHelmOp();

    const helmOpCreatePage = new FleetHelmOpCreateEditPo();

    helmOpCreatePage.waitForPage();

    // Metadata step
    helmOpCreatePage.resourceDetail().createEditView().nameNsDescription()
      .name()
      .set(helmOpName);
    helmOpCreatePage.resourceDetail().createEditView().nextPage();

    // Chart step
    helmOpCreatePage.setChart(chart.name);
    helmOpCreatePage.setRepository(chart.repository);
    helmOpCreatePage.setVersion(chart.version);
    helmOpCreatePage.resourceDetail().createEditView().nextPage();

    // Values step - keep defaults
    helmOpCreatePage.resourceDetail().createEditView().nextPage();

    // Target step - target all clusters (index 0 of the radio group)
    helmOpCreatePage.setTargetNamespace('default');
    helmOpCreatePage.targetClusterOptions().set(0);
    helmOpCreatePage.resourceDetail().createEditView().nextPage();

    // Advanced step - create
    helmOpCreatePage.resourceDetail().createEditView().create()
      .then(() => {
        helmOpsToDelete.push(`${ workspace }/${ helmOpName }`);
      });

    cy.wait('@createHelmOp').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(request.body.spec.helm.chart).to.eq(chart.name);
      expect(request.body.spec.helm.version).to.eq(chart.version);
    });
  });

  it('lists the created HelmOp and opens its detail view', () => {
    listPage.goTo();
    listPage.waitForPage();
    headerPo.selectWorkspace(workspace);

    // The HelmOp is viewable in the App Bundles list
    listPage.list().rowWithName(helmOpName).self()
      .should('be.visible');

    // ...and its detail (view) page renders with the right title
    listPage.goToDetailsPage(helmOpName);

    const helmOpDetailPage = new FleetHelmOpCreateEditPo(workspace, helmOpName);

    helmOpDetailPage.mastheadTitle().then((title) => {
      expect(title.replace(/\s+/g, ' ')).to.contain(helmOpName);
    });
  });

  it('edits the created HelmOp', () => {
    cy.intercept('PUT', `/v1/fleet.cattle.io.helmops/${ workspace }/${ helmOpName }`).as('updateHelmOp');

    const description = `${ helmOpName }-edited`;

    listPage.goTo();
    listPage.waitForPage();
    headerPo.selectWorkspace(workspace);
    listPage.list().actionMenu(helmOpName).getMenuItem('Edit Config').click();

    const helmOpEditPage = new FleetHelmOpCreateEditPo(workspace, helmOpName);

    helmOpEditPage.waitForPage('mode=edit');

    // Change the description on the metadata step (stable, no async chart re-fetch)
    helmOpEditPage.resourceDetail().createEditView().nameNsDescription()
      .description()
      .set(description);

    // The wizard's primary button only becomes "finish" (save) on the last step,
    // so advance through every step before saving. Steps: metadata, chart, values,
    // target, advanced.
    helmOpEditPage.resourceDetail().createEditView().nextPage(); // Chart
    helmOpEditPage.resourceDetail().createEditView().nextPage(); // Values
    helmOpEditPage.resourceDetail().createEditView().nextPage(); // Target
    helmOpEditPage.resourceDetail().createEditView().nextPage(); // Advanced (last)
    helmOpEditPage.resourceDetail().createEditView().save(); // Finish

    cy.waitForInterceptWithConflictRetry('@updateHelmOp').then(({ request, response }: any) => {
      expect(response?.statusCode).to.be.oneOf([200, 201]);
      expect(JSON.stringify(request.body)).to.contain(description);
    });
  });

  after(() => {
    helmOpsToDelete.forEach((h) => cy.deleteRancherResource('v1', 'fleet.cattle.io.helmops', h, false));
  });
});
