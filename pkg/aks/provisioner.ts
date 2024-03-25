import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';
import CruAks from './components/CruAks.vue';
import { mapDriver } from '@shell/store/plugins';
import type { Component } from 'vue';

export class AKSProvisioner implements IClusterProvisioner {
  static ID = 'azureaks'

  constructor(private context: ClusterProvisionerContext) {
    mapDriver(this.id, 'azure' );
  }

  get id(): string {
    return AKSProvisioner.ID;
  }

  get icon(): any {
    return require('./icon.svg');
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
