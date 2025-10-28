import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';
import CruGKE from './components/CruGKE.vue';
import { Component } from 'vue';
import { isProviderEnabled } from '@shell/utils/settings';
import { mapDriver } from '@shell/store/plugins';

export class GKEProvisioner implements IClusterProvisioner {
  static ID = 'gke';

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
    return 'hosted';
  }

  get label(): string {
    return this.context.t('gke.label');
  }

  get description(): string {
    return this.context.t('gke.description');
  }

  get component(): Component {
    return CruGKE;
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
