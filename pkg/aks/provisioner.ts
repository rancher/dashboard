import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';
import CruAks from './components/CruAks.vue';
import { mapDriver } from '@shell/store/plugins';
import { Component } from 'vue/types/umd';

export class AKSProvisioner implements IClusterProvisioner {
  static ID = 'AKS'

  constructor(private context: ClusterProvisionerContext) {
    // configureCredential(this.id, 'azure' );
    mapDriver(this.id, 'azure' );
  }

  get id(): string {
    return AKSProvisioner.ID;
  }

  get icon(): any {
    return require('./assets/aks.svg');
  }

  get group(): string {
    return 'kontainer';
  }

  get label(): string {
    return this.context.t('aks.label');
  }

  get component(): Component {
    return CruAks;
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
}
