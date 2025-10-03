import PagePo from '@/cypress/e2e/po/pages/page.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import ClusterManagerCreateRke2AzurePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-azure.po';
import AzureCloudCredentialsCreateEditPo from '@/cypress/e2e/po/edit/cloud-credentials-azure.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';

/**
 * Create page for an AKS cluster
 */
export default class ClusterManagerCreateAKSPagePo extends ClusterManagerCreateRke2AzurePagePo {
  static url(clusterId: string) {
    return `${ ClusterManagerCreatePagePo.url(clusterId) }/create?type=azureaks&rkeType=rke2`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(ClusterManagerCreateRke2AzurePagePo.url(clusterId));
  }

  goToAzureClusterCreation(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`${ ClusterManagerCreatePagePo.url(clusterId) }?type=azureaks&rkeType=rke2`);
  }

  cloudCredentialsForm(): AzureCloudCredentialsCreateEditPo {
    return new AzureCloudCredentialsCreateEditPo();
  }

  getClusterName() {
    return LabeledInputPo.byLabel(cy.get('.col.span-4'), 'Name');
  }

  getClusterDescription() {
    return new LabeledInputPo('[placeholder*="better describes this resource"]');
  }

  getRegion() {
    return new LabeledSelectPo('[data-testid="cruaks-resourcelocation"]');
  }

  getKubernetesVersion() {
    return new LabeledSelectPo('[data-testid="cruaks-kubernetesversion"]');
  }

  getNodeGroup() {
    return LabeledInputPo.byLabel(cy.get('.pool'), 'Name');
  }

  getOSdiskType() {
    return LabeledSelectPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'OS Disk Type');
  }

  getVMsize() {
    return LabeledSelectPo.byLabel(cy.get('.pool'), 'VM Size');
  }

  getAvailabiltyZones() {
    return LabeledSelectPo.byLabel(cy.get('.pool'), 'Availability Zones');
  }

  getOSdiskSize() {
    return LabeledInputPo.byLabel(cy.get('.pool'), 'OS Disk Size');
  }

  getNodeCount() {
    return new LabeledInputPo('[data-testid="aks-pool-count-input"]');
  }

  getMaxPods() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Max Pods per Node');
  }

  getMaxSurge() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Max Surge');
  }

  getLinuxAdmin() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Linux Admin Username');
  }

  getClusterResourceGroup() {
    return new LabeledInputPo(cy.get('[placeholder*="aks-resource-group"]'));
  }

  getNodeResourceGroup() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Node Resource Group');
  }

  getAutoScaling() {
    return CheckboxInputPo.byLabel(this.self(), 'Enable Auto Scaling');
  }

  getLogResourceGroup() {
    return new LabeledInputPo('[data-testid="aks-log-analytics-workspace-group-input"]');
  }

  getLogWorkspaceName() {
    return new LabeledInputPo('[data-testid="aks-log-analytics-workspace-group-input"]');
  }

  getSSHkey() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'SSH Public Key');
  }

  getLoadBalancerSKU() {
    return LabeledSelectPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Load Balancer SKU');
  }

  getInputDNSprefix() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'DNS Prefix');
  }

  getOutboundType() {
    return LabeledSelectPo.byLabel(cy.get('.labeled-select'), 'Outbound Type');
  }

  getNetworkPlugin() {
    return LabeledSelectPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Network Plugin');
  }

  getNetworkPolicy() {
    return LabeledSelectPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Network Policy');
  }

  getVirtualNetwork() {
    return LabeledSelectPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Virtual Network');
  }

  getKubernetesSAR() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Kubernetes Service Address Range');
  }

  getKubernetesDNS() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Kubernetes DNS Service IP Address');
  }

  getDockerBridge() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Docker Bridge Address');
  }

  getProjNetworkIsolation() {
    return CheckboxInputPo.byLabel(this.self(), 'Project Network Isolation');
  }

  getHTTProuting() {
    return CheckboxInputPo.byLabel(this.self(), 'HTTP Application Routing');
  }

  getEnablePrivateCluster() {
    return CheckboxInputPo.byLabel(this.self(), 'Enable Private Cluster');
  }

  getAuthIPranges() {
    return CheckboxInputPo.byLabel(this.self(), 'Set Authorized IP Ranges');
  }

  getNetorkingRadioGroup() {
    return new RadioGroupInputPo('[.pool .radio-group]');
  }

  getContainerMonitoring() {
    return new CheckboxInputPo('[data-testid="aks-monitoring-checkbox"]');
  }

  getLatestAKSversion(versions: string[]): string {
    // Helper function to compare versions
    function compareVersions(a: string, b: string): number {
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);

      for (let i = 0; i < 3; i++) {
        const diff = (aParts[i] || 0) - (bParts[i] || 0);

        if (diff !== 0) return diff;
      }

      return 0;
    }

    if (!versions || versions.length === 0) {
      throw new Error('No versions found');
    }
    let latest = versions[0];

    for (const version of versions) {
      if (compareVersions(version, latest) > 0) {
        latest = version;
      }
    }

    return latest;
  }
}
