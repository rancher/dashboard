import { RegisterClusterSaveHook, IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';

import { CAPI as CAPI_LABELS } from '@shell/config/labels-annotations';
import CruAks from './components/CruAks.vue';
import { configureCredential, mapDriver } from '@shell/store/plugins';
import { Component } from 'vue/types/umd';
import { Route } from 'vue-router';

const RANCHER_CLUSTER = 'provisioning.cattle.io.cluster';

export class AKSProvisioner implements IClusterProvisioner {
  // on create this needs to overwrite the kontainer driver option with id 'azureaks' to load the extension form
  // on edit, however, instead of selecting a driver we need to load the extension's form based of status.provisioner which is 'AKS'
  static OVERWRITE_DRIVER = 'azureaks';

  static ID = 'AKS'

  constructor(private context: ClusterProvisionerContext) {
    // configureCredential(this.id, 'azure' );
    mapDriver(this.id, 'azure' );
  }

  get id(): string {
    return AKSProvisioner.ID;
  }

  get overwriteDriver(): string {
    return AKSProvisioner.OVERWRITE_DRIVER;
  }

  get namespaced(): boolean {
    return true;
  }

  // TODO nb remove from shell/assets/providers
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

  private debug(...args: any[]) {
    console.debug('aks provisioner', ...args, this.context);
  }
}
