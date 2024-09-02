import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';
import CruGKE from './components/CruGKE.vue';
import { mapDriver } from '@shell/store/plugins';
import { Component } from 'vue/types/umd';

export class GKEProvisioner implements IClusterProvisioner {
  static ID = 'googlegke'

  constructor(private context: ClusterProvisionerContext) {
    mapDriver(this.id, 'gcp' );
  }

  get id(): string {
    return GKEProvisioner.ID;
  }

  get icon(): any {
    return require('./assets/gke.svg');
  }

  get group(): string {
    return 'kontainer';
  }

  get label(): string {
    return this.context.t('gke.label');
  }

  get component(): Component {
    return CruGKE;
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
