import { RegisterClusterSaveHook, IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';

import { CAPI as CAPI_LABELS } from '@shell/config/labels-annotations';
import CruAks from './components/CruAks.vue';
import { configureCredential, mapDriver } from '@shell/store/plugins';
import { Component } from 'vue/types/umd';
import { Route } from 'vue-router';

const RANCHER_CLUSTER = 'provisioning.cattle.io.cluster';

export class AKSProvisioner implements IClusterProvisioner {
  static ID = 'azureaks-ext';

  constructor(private context: ClusterProvisionerContext) {
    // configureCredential(this.id, 'azure' );
    mapDriver(this.id, 'azure' );
  }

  get id(): string {
    return AKSProvisioner.ID;
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

  // get link(): Route {
  //   // TODO nb add router to prov cluster context def
  //   const { router } = this.context;

  //   return router.resolve({ name: 'c-cluster-manager-aks-create', params: { cluster: '_' } }).route;
  // }

  // get machineConfigSchema(): { [key: string]: any } {
  //   return { id: 'rke-machine-config.cattle.io.testconfig' };
  // }

  // get description(): string {
  //   return this.context.t('provisioner.description');
  // }

  // get tag(): string {
  //   return this.context.t('provisioner.tag');
  // }

  async createMachinePoolMachineConfig(idx: number, pools: any, cluster: any) { // eslint-disable-line require-await
    this.debug('aks createMachinePoolMachineConfig', idx, pools, cluster);

    return {};
  }

  registerSaveHooks(registerBeforeHook: RegisterClusterSaveHook, registerAfterHook: RegisterClusterSaveHook, cluster: any): void {
    this.debug('registerSaveHooks', registerBeforeHook, registerAfterHook, cluster, this);

    registerBeforeHook(this.beforeSave, 'custom-before-hook', 99);
    registerAfterHook(this.afterSave, 'custom-after-hook', 99, this);
  }

  /**
   * Example of a function that will run in the before the cluster is saved
   *
   * When `provision` is implemented the before / after save hooks are skipped
   *
   * This example hasn't been registered with a `fnContext` param, so the `this` context is the vue component from hte ui
   */
  async beforeSave(cluster: any) { // eslint-disable-line require-await
    console.debug('aks provisioner before save hook', ...arguments);

    const clusterFromComponent = (this as any).value;

    // clusterFromComponent.metadata.annotations = cluster.metadata.annotations || {};
    // clusterFromComponent.metadata.annotations[CAPI_LABELS.UI_CUSTOM_PROVIDER] = AKSProvisioner.ID;
  }

  /**
   * Example of a function that will run in the after hook
   *
   * When `provision` is implemented the before / after save hooks are skipped
   */
  async afterSave(cluster: any) { // eslint-disable-line require-await
    this.debug('aks provisioner after save hook', ...arguments);
  }

  async saveMachinePoolConfigs(pools: any[], cluster: any) { // eslint-disable-line require-await
    // this.debug('saveMachinePoolConfigs', pools, cluster);

    // return true;
  }

  get detailTabs() {
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

  // Returns an array of error messages or an empty array if provisioning was successful
  async provision(cluster: any, pools: any)/*: Promise<any[]> */ {
    this.debug('aks provision', cluster, pools);

    // const { dispatch } = this.context;

    // cluster.metadata.annotations = cluster.metadata.annotations || {};
    // cluster.metadata.annotations[CAPI_LABELS.UI_CUSTOM_PROVIDER] = this.id;

    // // Create an empty cluster - this will show up as an imported cluster in the UI
    // const rancherCluster = await dispatch('management/create', {
    //   type:     RANCHER_CLUSTER,
    //   metadata: {
    //     name:      cluster.name,
    //     namespace: cluster.namespace,
    //   },
    //   spec: { rkeConfig: {} }
    // });

    // this.debug(rancherCluster);

    // try {
    //   await cluster.save();
    // } catch (e) {
    //   console.error(e); // eslint-disable-line no-console

    //   return [e];
    // }

    // return [];
  }

  private debug(...args: any[]) {
    console.debug('aks provisioner', ...args, this.context);
  }
}
