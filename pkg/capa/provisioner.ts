import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';
import { mapDriver } from '@shell/store/plugins';
import { DEFAULT_WORKSPACE } from '@shell/config/types';
import { saveMachinePoolConfigs } from './machine-config/utils';
import PoolsSharedSection from './components/PoolsSharedSection.vue';
export class CAPAProvisioner implements IClusterProvisioner {
  static ID = 'capa'

  constructor(private context: ClusterProvisionerContext) {
    mapDriver(this.id, 'aws' );
  }

  get id(): string {
    return CAPAProvisioner.ID;
  }

  get machineConfigSchema(): { [key: string]: any } {
    return this.context.getters['management/schemaFor']('infrastructure.cluster.x-k8s.io.awsmachinetemplate'); // TODO:make this a type
    // return this.context.getters['management/schemaFor']('rke-machine-config.cattle.io.amazonec2config');
  }

  get clusterSchema(): { [key: string]: any } {
    return this.context.getters['management/schemaFor']('infrastructure.cluster.x-k8s.io.awscluster');
  }

  get createMachinePoolMachineConfig(): (idx: number, pools: any[], cluster: any) => Promise<{[key: string]: any}> {
    return async(idx: number, pools: any[], cluster: any) => {
      const createConfig = await this.context.dispatch('management/createPopulated', {
        type:     this.machineConfigSchema.id,
        metadata: { namespace: DEFAULT_WORKSPACE }
      });
      const config = createConfig?.spec?.template?.spec || {};

      // TODO apply some defaults maybe?
      return config;
    };
  }

  get saveMachinePoolConfigs(): (pools: any[], cluster: any) => Promise<any> {
    return async(pools: any[], cluster: any) => await saveMachinePoolConfigs(pools, cluster);
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

  // get component(): Component {
  //   return CruCAPA;
  // }

  get hidden(): boolean {
    return false; //! isProviderEnabled(this.context, this.id);
  }

  get extensionTopPoolSection(): any {
    return PoolsSharedSection;
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
