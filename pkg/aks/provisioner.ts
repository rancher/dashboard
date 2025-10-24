import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';
import CruAks from './components/CruAks.vue';
import type { Component } from 'vue';
import { isProviderEnabled } from '@shell/utils/settings';

export class AKSProvisioner implements IClusterProvisioner {
  static ID = 'aks'
  private readonly context: ClusterProvisionerContext;

  constructor(context: ClusterProvisionerContext) {
    this.context = context;
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
    return isProviderEnabled(this.context, this.id);
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
