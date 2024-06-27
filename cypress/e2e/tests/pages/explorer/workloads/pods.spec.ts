import { WorkloadsPodsListPagePo, WorkLoadsPodDetailsPagePo, WorkloadsPodsCreatePagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';
import { createPodBlueprint, clonePodBlueprint } from '@/cypress/e2e/blueprints/explorer/workload-pods';
import PodPo from '@/cypress/e2e/po/components/workloads/pod.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { generatePodsDataSmall } from '@/cypress/e2e/blueprints/explorer/workloads/pods/pods-get';

describe('Pods', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  const workloadsPodPage = new WorkloadsPodsListPagePo('local');
  const nsName = `namespace${ +new Date() }`;
  const nsName2 = `namespace${ +new Date() }abc`;
  const uniquePod = 'aaa-e2e-test-pod-name';
  const podNamesList = [];

  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai'] }, () => {
    before('set up', () => {
      cy.updateResourceListViewPref('local', 'none', '{\"local\":[]}');

      // create namespaces
      cy.createNamespace(nsName);
      cy.createNamespace(nsName2);

      // create pods
      let i = 0;

      while (i < 100) {
        const podName = `e2e-${ Cypress._.uniqueId(Date.now().toString()) }`;

        cy.createPod(nsName, podName, 'nginx:latest', false).then(() => {
          podNamesList.push(`pod-${ podName }`);
        });

        i++;
      }

      // create unique pod for sorting test
      cy.createPod(nsName2, uniquePod, 'nginx:latest');
    });

    it('pagination is visible and user is able navigate through pods data', () => {
      // get pods count
      cy.getRancherResource('v1', 'pods').then((resp: Cypress.Response<any>) => {
        const count = resp.body.count;

        WorkloadsPodsListPagePo.navTo();
        workloadsPodPage.waitForPage();

        // pagination is visible
        workloadsPodPage.sortableTable().pagination().checkVisible();

        // basic checks on navigation buttons
        workloadsPodPage.sortableTable().pagination().beginningButton().isDisabled();
        workloadsPodPage.sortableTable().pagination().leftButton().isDisabled();
        workloadsPodPage.sortableTable().pagination().rightButton().isEnabled();
        workloadsPodPage.sortableTable().pagination().endButton().isEnabled();

        // check text before navigation
        workloadsPodPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`1 - 100 of ${ count } Pods`);
        });

        // navigate to next page - right button
        workloadsPodPage.sortableTable().pagination().rightButton().click();

        // check text and buttons after navigation
        workloadsPodPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`101 - ${ count } of ${ count } Pods`);
        });
        workloadsPodPage.sortableTable().pagination().beginningButton().isEnabled();
        workloadsPodPage.sortableTable().pagination().leftButton().isEnabled();

        // navigate to first page - left button
        workloadsPodPage.sortableTable().pagination().leftButton().click();

        // check text and buttons after navigation
        workloadsPodPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`1 - 100 of ${ count } Pods`);
        });
        workloadsPodPage.sortableTable().pagination().beginningButton().isDisabled();
        workloadsPodPage.sortableTable().pagination().leftButton().isDisabled();

        // navigate to last page - end button
        workloadsPodPage.sortableTable().pagination().endButton().click();

        // check text after navigation
        workloadsPodPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`101 - ${ count } of ${ count } Pods`);
        });

        // navigate to first page - beginning button
        workloadsPodPage.sortableTable().pagination().beginningButton().click();

        // check text and buttons after navigation
        workloadsPodPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`1 - 100 of ${ count } Pods`);
        });
        workloadsPodPage.sortableTable().pagination().beginningButton().isDisabled();
        workloadsPodPage.sortableTable().pagination().leftButton().isDisabled();
      });
    });

    it('filter pods', () => {
      WorkloadsPodsListPagePo.navTo();
      workloadsPodPage.waitForPage();

      workloadsPodPage.sortableTable().checkVisible();
      workloadsPodPage.sortableTable().checkLoadingIndicatorNotVisible();
      workloadsPodPage.sortableTable().checkRowCount(false, 100);

      // filter by name
      workloadsPodPage.sortableTable().filter(podNamesList[0]);
      workloadsPodPage.sortableTable().checkRowCount(false, 1);
      workloadsPodPage.sortableTable().rowElementWithName(podNamesList[0]).should('be.visible');

      // filter by namespace
      workloadsPodPage.sortableTable().filter(nsName2);
      workloadsPodPage.sortableTable().checkRowCount(false, 1);
      workloadsPodPage.sortableTable().rowElementWithName(`pod-${ uniquePod }`).should('be.visible');
    });

    it('sorting changes the order of paginated pods data', () => {
      WorkloadsPodsListPagePo.navTo();
      workloadsPodPage.waitForPage();

      /**
       * Sort by Name
       */
      // check table is sorted by name in ASC order by default
      workloadsPodPage.sortableTable().tableHeaderRow().checkSortOrder(2, 'down');

      // pod name should be visible on first page (sorted in ASC order)
      workloadsPodPage.sortableTable().rowElementWithName(podNamesList[0]).scrollIntoView().should('be.visible');

      // sort by name in DESC order
      workloadsPodPage.sortableTable().sort(2).click({ force: true });
      workloadsPodPage.sortableTable().tableHeaderRow().checkSortOrder(2, 'up');

      // pod name should be NOT visible on first page (sorted in DESC order)
      workloadsPodPage.sortableTable().rowElementWithName(podNamesList[0]).should('not.exist');

      // navigate to last page
      workloadsPodPage.sortableTable().pagination().endButton().click();

      // pod name should be visible on last page (sorted in DESC order)
      workloadsPodPage.sortableTable().rowElementWithName(podNamesList[0]).scrollIntoView().should('be.visible');
    });

    it('pagination is hidden', () => {
      // generate small set of pods data
      generatePodsDataSmall();
      HomePagePo.goTo(); // this is needed here for the intercept to work
      WorkloadsPodsListPagePo.navTo();
      workloadsPodPage.waitForPage();
      cy.wait('@podsDataSmall');

      workloadsPodPage.sortableTable().checkVisible();
      workloadsPodPage.sortableTable().checkLoadingIndicatorNotVisible();
      workloadsPodPage.sortableTable().checkRowCount(false, 3);
      workloadsPodPage.sortableTable().pagination().checkNotExists();
    });
  });

  describe('Should open a terminal', () => {
    beforeEach(() => {
      workloadsPodPage.goTo();
    });

    it('should open a pod shell', () => {
      const shellPodPo = new PodPo();

      shellPodPo.openPodShell();
    });
  });

  describe('When cloning a pod', () => {
    const { name: origPodName, namespace } = createPodBlueprint.metadata;
    const { name: clonePodName } = clonePodBlueprint.metadata;

    beforeEach(() => {
      cy.intercept('GET', `/v1/pods/${ namespace }/${ origPodName }?exclude=metadata.managedFields`).as('origPod');
      cy.intercept('GET', `/v1/pods/${ namespace }/${ clonePodName }?exclude=metadata.managedFields`).as('clonedPod');

      workloadsPodPage.goTo();

      const createPodPo = new PodPo();

      createPodPo.createPodViaKubectl(createPodBlueprint);
    });

    it(`Should have same spec as the original pod`, () => {
      const cloneCreatePodPage = new WorkLoadsPodDetailsPagePo(origPodName, { mode: 'clone' });

      cloneCreatePodPage.goTo();

      let origPodSpec: any;

      cy.wait('@origPod', { timeout: 20000 })
        .then(({ response }) => {
          expect(response?.statusCode).to.eq(200);
          origPodSpec = response?.body.spec;
          expect(origPodSpec.containers[0].resources).to.deep.eq(createPodBlueprint.spec.containers[0].resources);
        });

      const createClonePo = new PodPo();

      // Each pod need a unique name
      createClonePo.nameNsDescription().name().set(clonePodName);
      createClonePo.save();

      workloadsPodPage.waitForPage();
      workloadsPodPage.list().checkVisible();
      workloadsPodPage.list().resourceTable().sortableTable().filter(clonePodName);
      workloadsPodPage.list().resourceTable().sortableTable().rowWithName(clonePodName)
        .checkExists();

      // Simple test to assert we haven't broken Pods detail page
      // https://github.com/rancher/dashboard/issues/10490
      const clonedPodPage = new WorkLoadsPodDetailsPagePo(clonePodName);

      clonedPodPage.goTo();// Needs to be goTo to ensure http request is fired
      clonedPodPage.waitForPage();

      cy.wait('@clonedPod', { timeout: 20000 })
        .then(({ response }) => {
          expect(response?.statusCode).to.eq(200);

          const clonedSpec = response?.body?.spec;

          // In Dashboard adds empty affinity object by default
          // Remove this to compare
          if (!Object.keys(clonedSpec.affinity).length) {
            delete clonedSpec.affinity;
          }

          expect(clonedSpec).to.deep.eq(origPodSpec);
          expect(clonedSpec.containers[0].resources).to.deep.eq(createPodBlueprint.spec.containers[0].resources);
        });
        });
      });

      describe('should delete pod', { tags: ['@explorer', '@adminUser'] }, () => {
        const podName = `test-pod-${ Date.now() }`;

        beforeEach(() => {
          workloadsPodPage.goTo();
        });

        after(() => {
          // cy.deleteRancherResource('v1', `pods/default`, podName);
        });

        it('dialog should open/close as expected', () => {
          const podCreatePage = new WorkloadsPodsCreatePagePo('local');

          podCreatePage.goTo();

          podCreatePage.createWithUI(podName, 'nginx', 'default');

          // Should be on the list view
          const podsListPage = new WorkloadsPodsListPagePo('local');

          // Filter the list to just show the newly created pod
          podsListPage.list().resourceTable().sortableTable().filter(podName);
          podsListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);

          // Open action menu and delete for the first item
          podsListPage.list().resourceTable().sortableTable().rowActionMenuOpen(podName)
            .getMenuItem('Delete')
            .click();

          let dialog = new PromptRemove();

          dialog.checkExists();
          dialog.checkVisible();

          dialog.cancel();
          dialog.checkNotExists();

          podsListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);

          // Open action menu and delete for the first item
          podsListPage.list().resourceTable().sortableTable().rowActionMenuOpen(podName)
            .getMenuItem('Delete')
            .click();

          dialog = new PromptRemove();

          dialog.checkExists();
          dialog.checkVisible();
          dialog.remove();
          dialog.checkNotExists();

          podsListPage.list().resourceTable().sortableTable().checkRowCount(true, 1, true);

          podsListPage.list().resourceTable().sortableTable().resetFilter();
    });
  });

  after(() => {
    // delete namespace (this will also delete all pods in it)
    cy.deleteRancherResource('v1', 'namespaces', nsName);
    cy.deleteRancherResource('v1', 'namespaces', nsName2);
  });
});
