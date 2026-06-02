import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';
import { mapDriver } from '@shell/store/plugins';
import { DEFAULT_WORKSPACE } from '@shell/config/types';
import { saveMachinePoolConfigs } from './machine-config/utils';
import ClusterConfiguration from './components/ClusterConfiguration.vue';
import { CAPI } from '@shell/config/labels-annotations';

const AWS_MACHINE_TEMPLATE_SCHEMA = 'infrastructure.cluster.x-k8s.io.awsmachinetemplate';
const AWS_CLUSTER_SCHEMA = 'infrastructure.cluster.x-k8s.io.awscluster';
const ADDITIONAL_MANIFEST = `apiVersion: helm.cattle.io/v1
kind: HelmChart
metadata:
  name: aws-cloud-controller-manager
  namespace: kube-system
spec:
  chart: aws-cloud-controller-manager
  repo: https://kubernetes.github.io/cloud-provider-aws
  targetNamespace: kube-system
  bootstrap: true
  valuesContent: |-
    hostNetworking: true
    nodeSelector:
      node-role.kubernetes.io/control-plane: "true"
    args:
      - --configure-cloud-routes=false
      - --v=5
      - --cloud-provider=aws`;

export class CAPAProvisioner implements IClusterProvisioner {
  static ID = 'capa'

  constructor(private context: ClusterProvisionerContext) {
    mapDriver(this.id, 'aws' );
  }

  get id(): string {
    return CAPAProvisioner.ID;
  }

  get machineConfigSchema(): { [key: string]: any } {
    return this.context.getters['management/schemaFor'](AWS_MACHINE_TEMPLATE_SCHEMA, true, false); // ||
  }

  get clusterSchema(): { [key: string]: any } {
    return this.context.getters['management/schemaFor'](AWS_CLUSTER_SCHEMA, true, false); // ||
  }

  get createMachinePoolMachineConfig(): (idx: number, pools: any[], cluster: any) => Promise<{[key: string]: any}> {
    return async(idx: number, pools: any[], cluster: any) => {
      const machineConfigType = this.machineConfigSchema?.id || AWS_MACHINE_TEMPLATE_SCHEMA;

      await this.context.dispatch('management/waitForSchema', { type: machineConfigType });

      const createConfig = await this.context.dispatch('management/createPopulated', {
        type:     machineConfigType,
        metadata: { namespace: DEFAULT_WORKSPACE }
      });

      const config = createConfig || {};

      // TODO apply some defaults maybe?
      return config;
    };
  }

  get saveMachinePoolConfigs(): (pools: any[], cluster: any) => Promise<any> {
    return async(pools: any[], cluster: any) => await saveMachinePoolConfigs(pools, cluster);
  }

  registerSaveHooks(
    registerBeforeHook: (fn: () => Promise<void>, name: string, priority?: number) => void,
    _registerAfterHook: any,
    value: any,
    getCapiCluster: () => any
  ): void {
    registerBeforeHook(async() => {
      const capiCluster = getCapiCluster();

      if (!capiCluster) {
        return;
      }

      const clusterName = value.metadata?.name;

      if (!clusterName) {
        return;
      }

      capiCluster.metadata = capiCluster.metadata || {};
      capiCluster.metadata.name = clusterName;
      capiCluster.metadata.namespace = capiCluster.metadata.namespace || DEFAULT_WORKSPACE;

      await capiCluster.save();

      if (!value.spec.rkeConfig) {
        value.spec.rkeConfig = {};
      }

      value.spec.rkeConfig.infrastructureRef = {
        kind:       'AWSCluster',
        name:       clusterName,
        namespace:  DEFAULT_WORKSPACE,
        apiVersion: 'infrastructure.cluster.x-k8s.io/v1beta2',
      };
      value.spec.rkeConfig.additionalManifest = ADDITIONAL_MANIFEST;
      value.spec.rkeConfig.machineGlobalConfig['cloud-provider-name'] = 'external';
      value.spec.rkeConfig.machineGlobalConfig['node-name-from-cloud-provider-metadata'] = true;

      if (!value.metadata.annotations) {
        value.metadata.annotations = {};
      }
      // set an annotation to tell the ui that the 'Provider' is 'capa' so the right edit components load
      // and so the Provider column in the mgmt list says capa instead of awsmachinetemplate
      value.metadata.annotations[CAPI.UI_CUSTOM_PROVIDER] = this.id;
    }, 'save-capi-cluster', 1);
  }

  get icon(): any {
    return require('./assets/amazonecapa.svg');
  }

  get group(): string {
    return 'capi';
  }

  get label(): string {
    return this.context.t('capa.label');
  }

  get description(): string {
    return this.context.t('capa.description');
  }

  get hidden(): boolean {
    return false; //! isProviderEnabled(this.context, this.id);
  }

  get extensionInfrastructureSection(): any {
    return ClusterConfiguration;
  }

  get detailTabs(): any {
    return {
      machines:     false,
      logs:         false,
      registration: false,
      snapshots:    false,
      related:      true,
      events:       false,
      conditions:   false,
    };
  }

  get showImport(): boolean {
    return false;
  }
}
