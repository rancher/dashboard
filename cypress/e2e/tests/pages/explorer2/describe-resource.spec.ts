import { WorkloadsPodsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';
import SlideInPo from '@/cypress/e2e/po/side-bars/slide-in.po';
import WorkloadPagePo from '@/cypress/e2e/po/pages/explorer/workloads.po';

const workloadsPage = new WorkloadPagePo('local');

describe('Can describe resource', { testIsolation: 'off', tags: ['@explorer2', '@adminUser', '@standardUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('Can open describe resource', () => {
    const workloadsPodPage = new WorkloadsPodsListPagePo('local');

    workloadsPodPage.goTo();
    workloadsPodPage.waitForPage();
    // Open Describe resource
    workloadsPage.actionsHeader().kubectlExplain().click();

    const slideIn = new SlideInPo();

    slideIn.checkExists();
    slideIn.checkVisible();
    slideIn.closeButton().click();
    slideIn.checkNotVisible();
  });
});
