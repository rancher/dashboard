import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';
import CruAks from './components/CruAks.vue';
import type { Component } from 'vue';
import { isProviderEnabled } from '@shell/utils/settings';
import { mapDriver } from '@shell/store/plugins';
export class AKSProvisioner implements IClusterProvisioner {
  static ID = 'aks'

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
    return 'hosted';
  }

  get label(): string {
    return this.context.t('aks.label');
  }

  get component(): Component {
    return CruAks;
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

  get description(): string {
    return this.context.t('aks.description');
  }
}
