import { WorkLoadsPodDetailsPagePo, WorkloadsPodsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';
import { WorkloadsReplicasetsEditPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-replicasets.po';
import IdentifyingInformationPo from '@/cypress/e2e/po/components/identifying-information.po';
import { SMALL_CONTAINER } from '@/cypress/e2e/tests/pages/explorer2/workloads/workload.utils';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

const CLUSTER = 'local';
const WORKLOAD = 'popover-workload';
const NAMESPACE_CONTEXT = 'popovers';
const NAMESPACES_OF_EARLIER_RUNS = new RegExp(`^e2e-test-\\d+-${ NAMESPACE_CONTEXT }$`);
const MASTHEAD_POPOVER_ROWS = ['Namespace', 'ReplicaSet', 'Node'];

const deploymentIn = (namespace: string) => ({
  type:     'apps.deployment',
  metadata: { name: WORKLOAD, namespace },
  spec:     {
    replicas: 1,
    selector: { matchLabels: { app: WORKLOAD } },
    template: {
      metadata: { labels: { app: WORKLOAD } },
      spec:     { containers: [{ name: SMALL_CONTAINER.name, image: SMALL_CONTAINER.image }] }
    }
  }
});

const runningPodOf = (resp: any) => resp?.body?.data?.find((pod: any) => pod.metadata.ownerReferences?.[0]?.kind === 'ReplicaSet' &&
  pod.spec.nodeName &&
  pod.metadata.state?.name === 'running'
);

describe('Resource popovers', { testIsolation: false, tags: ['@explorer2', '@adminUser'] }, () => {
  let namespace: string;
  let replicaSet: string;
  let podName: string;
  let nodeName: string;

  const deleteNamespacesLeftByEarlierRuns = () => cy.getRancherResource('v1', 'namespaces').then((resp) => {
    resp.body.data
      .map((ns: any) => ns.id)
      .filter((id: string) => NAMESPACES_OF_EARLIER_RUNS.test(id) && id !== namespace)
      .forEach((id: string) => cy.deleteRancherResource('v1', 'namespaces', id, false));
  });

  before(() => {
    cy.login();

    cy.createE2EResourceName(NAMESPACE_CONTEXT).then((name) => {
      namespace = name;
    });

    cy.then(deleteNamespacesLeftByEarlierRuns);
    cy.then(() => cy.createRancherResource('v1', 'namespaces', { type: 'namespace', metadata: { name: namespace } }, false));
    cy.then(() => cy.createRancherResource('v1', 'apps.deployments', deploymentIn(namespace), false));
    cy.then(() => cy.waitForRancherResource('v1', 'pods', namespace, (resp) => !!runningPodOf(resp), 60, { returnResource: true }))
      .then((resp) => {
        const pod = runningPodOf(resp);

        expect(pod, `a running pod of the ${ WORKLOAD } deployment`).to.exist;

        podName = pod.metadata.name;
        nodeName = pod.spec.nodeName;
        replicaSet = pod.metadata.ownerReferences[0].name;
      });
  });

  beforeEach(() => {
    cy.viewport(1920, 1080);
  });

  after('clean up', () => {
    cy.tableRowsPerPageAndNamespaceFilter(100, CLUSTER, 'none', `{"${ CLUSTER }":["all://user"]}`);

    if (namespace) {
      cy.deleteRancherResource('v1', 'namespaces', namespace, false);
    }
  });

  describe('Pod detail page', () => {
    const podPage = () => new WorkLoadsPodDetailsPagePo(podName, undefined, CLUSTER, namespace);
    const info = () => new IdentifyingInformationPo();
    const nameIn = (label: string) => ({
      Namespace: namespace, ReplicaSet: replicaSet, Node: nodeName
    }[label]);

    beforeEach(() => {
      podPage().goTo();
      podPage().waitForPage();
      info().self(MEDIUM_TIMEOUT_OPT).should('be.visible');
      MASTHEAD_POPOVER_ROWS.forEach((label) => info().link(label).should('be.visible'));
    });

    it('shows a state dot in front of each link that opens a popover', () => {
      MASTHEAD_POPOVER_ROWS.forEach((label) => {
        info().stateDot(label).should('be.visible')
          .next('a')
          .should('contain', nameIn(label));
      });
    });

    it('opens a popover from the link, but not from the space next to it', () => {
      MASTHEAD_POPOVER_ROWS.forEach((label) => {
        info().stateDot(label).should('be.visible');

        info().customValue(label).then(($value) => {
          const value = $value[0].getBoundingClientRect();
          const link = $value.find('a')[0].getBoundingClientRect();
          const spaceNextToLink = { x: link.right + 16, y: link.top + (link.height / 2) };

          expect(value.right, `the ${ label } value has space to the right of its link`).to.be.greaterThan(spaceNextToLink.x);

          cy.document().then((doc) => {
            const underPointer = doc.elementFromPoint(spaceNextToLink.x, spaceNextToLink.y);

            expect(underPointer?.closest('.popover-card-target'), `the ${ label } popover trigger under the space next to its link`).to.equal(null);
          });
        });

        info().link(label).realHover();
        info().popoverCard(label).should('be.visible').and('contain', nameIn(label));

        podPage().resourceDetail().masthead().resourceTitle()
          .realHover();
        info().popoverCard(label).should('not.exist');
      });
    });

    it('shows the related resources as links, without popovers', () => {
      podPage().resourceDetail().tabs().clickTabWithName('related');

      cy.get('[data-testid="tab-panel-related"]').contains('a', replicaSet).should('be.visible');
      cy.get('[data-testid="tab-panel-related"]').find('.popover-card-target').should('not.exist');
    });
  });

  describe('ReplicaSet detail page', () => {
    it('shows its pods in Related Resources as links, without popovers', () => {
      const replicaSetPage = new WorkloadsReplicasetsEditPagePo(replicaSet, undefined, CLUSTER, namespace);

      replicaSetPage.goTo();
      replicaSetPage.waitForPage();
      replicaSetPage.resourceDetail().tabs().clickTabWithName('related');

      cy.get('[data-testid="tab-panel-related"]').contains('a', podName).should('be.visible');
      cy.get('[data-testid="tab-panel-related"]').find('.popover-card-target').should('not.exist');
    });
  });

  describe('Pods list', () => {
    it('shows the node of a pod as a link, without a popover', () => {
      const podsPage = new WorkloadsPodsListPagePo(CLUSTER);

      cy.tableRowsPerPageAndNamespaceFilter(10, CLUSTER, 'none', `{"${ CLUSTER }":["ns://${ namespace }"]}`);
      podsPage.goTo();
      podsPage.waitForPage();

      podsPage.list().resourceTable().sortableTable().rowElementWithName(podName)
        .contains('a', nodeName)
        .should('exist');
      podsPage.list().resourceTable().sortableTable().rowElementWithName(podName)
        .find('.popover-card-target')
        .should('not.exist');
    });
  });
});
