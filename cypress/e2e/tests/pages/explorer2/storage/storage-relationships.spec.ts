import { PersistentVolumesPagePo, PersistentVolumeDetailPagePo } from '@/cypress/e2e/po/pages/explorer/persistent-volumes.po';
import { PersistentVolumeClaimDetailPagePo } from '@/cypress/e2e/po/pages/explorer/persistent-volume-claims.po';
import { WorkloadsDeploymentsListPagePo, WorkloadsDeploymentsDetailsPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import { WorkloadsStatefulSetsListPagePo, WorkloadsStatefulSetsDetailsPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-statefulsets.po';
import { SMALL_CONTAINER } from '@/cypress/e2e/tests/pages/explorer2/workloads/workload.utils';

const localCluster = 'local';

// No StorageClass objects back these, so claims only bind to a PV that is created for them
const BOUND_STORAGE_CLASS = 'e2e-manual';
const UNBOUND_STORAGE_CLASS = 'e2e-unbound';
const PENDING_STORAGE_CLASS = 'e2e-pending';

const container = (mountPath?: string, volumeName?: string) => ({
  name:         'container-0',
  image:        SMALL_CONTAINER.image,
  volumeMounts: volumeName ? [{ name: volumeName, mountPath }] : [],
});

const persistentVolume = (name: string, storageClassName: string, claimRef?: { namespace: string, name: string }) => ({
  apiVersion: 'v1',
  kind:       'PersistentVolume',
  metadata:   { name },
  spec:       {
    capacity:                      { storage: '1Gi' },
    accessModes:                   ['ReadWriteOnce'],
    persistentVolumeReclaimPolicy: 'Retain',
    storageClassName,
    hostPath:                      { path: `/tmp/${ name }`, type: 'DirectoryOrCreate' },
    ...(claimRef ? { claimRef } : {}),
  },
});

const claimSpec = (storageClassName: string, volumeName?: string) => ({
  accessModes: ['ReadWriteOnce'],
  resources:   { requests: { storage: '1Gi' } },
  storageClassName,
  ...(volumeName ? { volumeName } : {}),
});

const persistentVolumeClaim = (namespace: string, name: string, storageClassName: string, volumeName?: string) => ({
  apiVersion: 'v1',
  kind:       'PersistentVolumeClaim',
  metadata:   { name, namespace },
  spec:       claimSpec(storageClassName, volumeName),
});

const deployment = (namespace: string, name: string, claimName?: string) => ({
  apiVersion: 'apps/v1',
  kind:       'Deployment',
  metadata:   { name, namespace },
  spec:       {
    replicas: 1,
    selector: { matchLabels: { app: name } },
    template: {
      metadata: { labels: { app: name } },
      spec:     {
        terminationGracePeriodSeconds: 0,
        containers:                    [claimName ? container('/data', 'data') : container()],
        volumes:                       claimName ? [{ name: 'data', persistentVolumeClaim: { claimName } }] : [],
      },
    },
  },
});

const pod = (namespace: string, name: string, claimName: string) => ({
  apiVersion: 'v1',
  kind:       'Pod',
  metadata:   { name, namespace },
  spec:       {
    terminationGracePeriodSeconds: 0,
    containers:                    [container('/data', 'data')],
    volumes:                       [{ name: 'data', persistentVolumeClaim: { claimName } }],
  },
});

const statefulSet = (namespace: string, name: string) => ({
  apiVersion: 'apps/v1',
  kind:       'StatefulSet',
  metadata:   { name, namespace },
  spec:       {
    replicas:            2,
    serviceName:         name,
    podManagementPolicy: 'Parallel',
    selector:            { matchLabels: { app: name } },
    template:            {
      metadata: { labels: { app: name } },
      spec:     {
        terminationGracePeriodSeconds: 0,
        containers:                    [container('/data', 'data')],
      },
    },
    volumeClaimTemplates: [{ metadata: { name: 'data' }, spec: claimSpec(PENDING_STORAGE_CLASS) }],
  },
});

const findPodWithApp = (app: string) => (resp: any) => (resp.body?.data || []).find((p: any) => p.metadata?.labels?.app === app);

// waitForRancherResource resolves false when it gives up instead of failing, so each wait asserts its result
const waitForResource = (resourceType: string, id: string) => {
  return cy.waitForRancherResource('v1', resourceType, id, (resp: any) => resp.status === 200, 30, { failOnStatusCode: false }).should('eq', true);
};

const waitForNoPodsWithApp = (namespace: string, app: string) => {
  return cy.waitForRancherResource('v1', 'pods', namespace, (resp: any) => !findPodWithApp(app)(resp), 30).should('eq', true);
};

const scaleWorkload = (resourceType: string, id: string, replicas: number) => {
  return cy.getRancherResource('v1', resourceType, id).then((resp: any) => {
    cy.setRancherResource('v1', resourceType, id, { ...resp.body, spec: { ...resp.body.spec, replicas } });
  });
};

describe('Storage relationships', { testIsolation: false, tags: ['@explorer2', '@adminUser'] }, () => {
  let namespace: string;
  let otherNamespace: string;
  let boundVolumeName: string;
  let unboundVolumeName: string;
  let claimName: string;
  let deploymentName: string;
  let deploymentPodName: string;
  let noClaimDeploymentName: string;
  let otherNamespacePodName: string;
  let statefulSetName: string;
  let statefulSetClaimNames: string[];

  const navToVolumeDetail = (name: string) => {
    const volumesPage = new PersistentVolumesPagePo(localCluster);
    const volumeDetailPage = new PersistentVolumeDetailPagePo(name, localCluster);

    PersistentVolumesPagePo.navTo(localCluster);
    volumesPage.waitForPage();
    volumesPage.goToDetailsPage(name);
    volumeDetailPage.waitForPage();
    volumeDetailPage.waitForMastheadTitle(name);

    return volumeDetailPage;
  };

  // The claim name is shared with a claim in another namespace, so reach it through the bound volume
  const navToClaimDetail = () => {
    const volumeDetailPage = navToVolumeDetail(boundVolumeName);
    const claimDetailPage = new PersistentVolumeClaimDetailPagePo(namespace, claimName, localCluster);

    volumeDetailPage.clickClaimsTab();
    volumeDetailPage.claimsList().goToDetailsPage(claimName);
    claimDetailPage.waitForPage();
    claimDetailPage.waitForMastheadTitle(claimName);
    claimDetailPage.clickPodsTab();

    return claimDetailPage;
  };

  const navToDeploymentDetail = (name: string) => {
    const deploymentsPage = new WorkloadsDeploymentsListPagePo(localCluster);
    const deploymentDetailPage = new WorkloadsDeploymentsDetailsPagePo(name, localCluster, undefined, namespace);

    WorkloadsDeploymentsListPagePo.navTo(localCluster);
    deploymentsPage.waitForPage();
    deploymentsPage.goToDetailsPage(name);
    deploymentDetailPage.waitForPage();
    deploymentDetailPage.waitForMastheadTitle(name);
    deploymentDetailPage.clickStorageTab();

    return deploymentDetailPage;
  };

  const navToStatefulSetDetail = () => {
    const statefulSetsPage = new WorkloadsStatefulSetsListPagePo(localCluster);
    const statefulSetDetailPage = new WorkloadsStatefulSetsDetailsPagePo(statefulSetName, namespace, localCluster);

    WorkloadsStatefulSetsListPagePo.navTo(localCluster);
    statefulSetsPage.waitForPage();
    statefulSetsPage.goToDetailsPage(statefulSetName);
    statefulSetDetailPage.waitForPage();
    statefulSetDetailPage.waitForMastheadTitle(statefulSetName);
    statefulSetDetailPage.clickStorageTab();

    return statefulSetDetailPage;
  };

  before(() => {
    cy.login();
    cy.tableRowsPerPageAndNamespaceFilter(100, localCluster, 'none', '{"local":["all://user"]}');

    cy.getRootE2EResourceName().then((root) => {
      namespace = `${ root }-storage`;
      otherNamespace = `${ root }-storage-other`;
      boundVolumeName = `${ root }-bound-pv`;
      unboundVolumeName = `${ root }-unbound-pv`;
      claimName = `${ root }-claim`;
      deploymentName = `${ root }-pvc-deploy`;
      noClaimDeploymentName = `${ root }-no-pvc-deploy`;
      otherNamespacePodName = `${ root }-other-pod`;
      statefulSetName = `${ root }-sts`;
      statefulSetClaimNames = [`data-${ statefulSetName }-0`, `data-${ statefulSetName }-1`];

      cy.createNamespace(namespace);
      cy.createNamespace(otherNamespace);

      // Pre-bind the volume and claim to each other so binding doesn't depend on the PV controller's matching
      cy.createRancherResource('v1', 'persistentvolumes', JSON.stringify(persistentVolume(boundVolumeName, BOUND_STORAGE_CLASS, { namespace, name: claimName })));
      cy.createRancherResource('v1', 'persistentvolumes', JSON.stringify(persistentVolume(unboundVolumeName, UNBOUND_STORAGE_CLASS)));
      cy.createRancherResource('v1', 'persistentvolumeclaims', JSON.stringify(persistentVolumeClaim(namespace, claimName, BOUND_STORAGE_CLASS, boundVolumeName)));
      // Same claim name in another namespace, which the claim's Pods tab must not pick up
      cy.createRancherResource('v1', 'persistentvolumeclaims', JSON.stringify(persistentVolumeClaim(otherNamespace, claimName, PENDING_STORAGE_CLASS)));

      cy.createRancherResource('v1', 'apps.deployments', JSON.stringify(deployment(namespace, deploymentName, claimName)));
      cy.createRancherResource('v1', 'apps.deployments', JSON.stringify(deployment(namespace, noClaimDeploymentName)));
      cy.createRancherResource('v1', 'pods', JSON.stringify(pod(otherNamespace, otherNamespacePodName, claimName)));
      cy.createRancherResource('v1', 'apps.statefulsets', JSON.stringify(statefulSet(namespace, statefulSetName)));

      cy.waitForRancherResource('v1', 'persistentvolumes', boundVolumeName, (resp: any) => resp.body?.status?.phase === 'Bound', 30).should('eq', true);
      cy.waitForRancherResource('v1', 'pods', namespace, findPodWithApp(deploymentName), 30, { returnResource: true }).then((resp: any) => {
        expect(resp, 'deployment pod').to.not.eq(false);
        deploymentPodName = findPodWithApp(deploymentName)(resp).metadata.name;
      });
      waitForResource('pods', `${ otherNamespace }/${ otherNamespacePodName }`);
      statefulSetClaimNames.forEach((name) => waitForResource('persistentvolumeclaims', `${ namespace }/${ name }`));
    });
  });

  describe('PersistentVolume detail', () => {
    it('shows the volume details in the masthead', () => {
      const volumeDetailPage = navToVolumeDetail(boundVolumeName);

      volumeDetailPage.mastheadDetail('source').should('contain', 'HostPath');
      volumeDetailPage.mastheadDetail('capacity').should('contain', '1Gi');
      volumeDetailPage.mastheadDetail('reclaim-policy').should('contain', 'Retain');
      volumeDetailPage.mastheadDetail('storage-class').should('contain', BOUND_STORAGE_CLASS);
      volumeDetailPage.mastheadDetail('access-modes').should('contain', 'ReadWriteOnce');
    });

    it('lists the bound claim in the Claims tab', () => {
      const volumeDetailPage = navToVolumeDetail(boundVolumeName);

      volumeDetailPage.clickClaimsTab();
      volumeDetailPage.claimsList().sortableTable().checkRowCount(false, 1);
      volumeDetailPage.claimsList().sortableTable().rowElementWithName(claimName).should('be.visible');
    });

    it('shows the empty state for a volume that is not bound', () => {
      const volumeDetailPage = navToVolumeDetail(unboundVolumeName);

      volumeDetailPage.clickClaimsTab();
      volumeDetailPage.claimsTabPanel().should('contain', 'This volume is not bound to a PersistentVolumeClaim.');
    });
  });

  describe('PersistentVolumeClaim detail', () => {
    it('lists the pods that mount the claim, only from its own namespace', () => {
      const claimDetailPage = navToClaimDetail();

      claimDetailPage.podsList().sortableTable().checkRowCount(false, 1);
      claimDetailPage.podsList().sortableTable().rowElementWithName(deploymentPodName).should('be.visible');
      claimDetailPage.podsTabPanel().should('not.contain', otherNamespacePodName);
    });

    it('shows the empty state once the deployment is scaled to 0', () => {
      scaleWorkload('apps.deployments', `${ namespace }/${ deploymentName }`, 0);
      waitForNoPodsWithApp(namespace, deploymentName);

      const claimDetailPage = navToClaimDetail();

      claimDetailPage.podsTabPanel().should('contain', 'Could not find any Pods that mount this PersistentVolumeClaim.');
    });
  });

  describe('Workload Storage tab', () => {
    it('lists the claim mounted by a deployment and links to its detail page', () => {
      const deploymentDetailPage = navToDeploymentDetail(deploymentName);
      const claimDetailPage = new PersistentVolumeClaimDetailPagePo(namespace, claimName, localCluster);

      deploymentDetailPage.storageList().sortableTable().checkRowCount(false, 1);
      deploymentDetailPage.storageList().goToDetailsPage(claimName);
      claimDetailPage.waitForPage();
      claimDetailPage.waitForMastheadTitle(claimName);
    });

    it('shows the empty state for a deployment that mounts no claims', () => {
      const deploymentDetailPage = navToDeploymentDetail(noClaimDeploymentName);

      deploymentDetailPage.storageTabPanel().should('contain', 'Could not find any PersistentVolumeClaims mounted by this workload.');
    });

    it('lists the claims created from StatefulSet volumeClaimTemplates', () => {
      const statefulSetDetailPage = navToStatefulSetDetail();

      statefulSetDetailPage.storageList().sortableTable().checkRowCount(false, statefulSetClaimNames.length);
      statefulSetClaimNames.forEach((name) => {
        statefulSetDetailPage.storageList().sortableTable().rowElementWithName(name).should('be.visible');
      });
    });

    it('still lists the template claims after the StatefulSet is scaled to 0', () => {
      scaleWorkload('apps.statefulsets', `${ namespace }/${ statefulSetName }`, 0);
      waitForNoPodsWithApp(namespace, statefulSetName);

      const statefulSetDetailPage = navToStatefulSetDetail();

      statefulSetDetailPage.storageList().sortableTable().checkRowCount(false, statefulSetClaimNames.length);
      statefulSetClaimNames.forEach((name) => {
        statefulSetDetailPage.storageList().sortableTable().rowElementWithName(name).should('be.visible');
      });
    });
  });

  after('clean up', () => {
    cy.deleteNamespace([namespace, otherNamespace]);
    cy.deleteRancherResource('v1', 'persistentvolumes', boundVolumeName, false);
    cy.deleteRancherResource('v1', 'persistentvolumes', unboundVolumeName, false);
  });
});
