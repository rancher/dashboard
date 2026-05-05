import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';
import { mapDriver } from '@shell/store/plugins';
import { CAPI } from '@shell/config/types';
export class CAPAProvisioner implements IClusterProvisioner {
  static ID = 'capa'

  constructor(private context: ClusterProvisionerContext) {
    mapDriver(this.id, 'aws' );
  }

  get id(): string {
    return CAPAProvisioner.ID;
  }

  get machineConfigSchema(): { [key: string]: any } {
    return this.context.getters['management/schemaFor']('rke-machine-config.cattle.io.amazonec2config');
    // return this.context.getters['management/schemaFor']('rke-machine-config.cattle.io.amazonec2config');
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
