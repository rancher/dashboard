import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';
import CruEKS from './components/CruEKS.vue';
import { Component } from 'vue';
import { isProviderEnabled } from '@shell/utils/settings';
import { mapDriver } from '@shell/store/plugins';
export class EKSProvisioner implements IClusterProvisioner {
  static ID = 'eks'

  constructor(private context: ClusterProvisionerContext) {
    mapDriver(this.id, 'aws' );
  }

  get id(): string {
    return EKSProvisioner.ID;
  }

  get icon(): any {
    return require('./assets/amazoneks.svg');
  }

  get group(): string {
    return 'hosted';
  }

  get label(): string {
    return this.context.t('eks.label');
  }

  get description(): string {
    return this.context.t('eks.description');
  }

  get component(): Component {
    return CruEKS;
  }

  get hidden(): boolean {
    return !isProviderEnabled(this.context, this.id);
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
    return true;
  }
}
