import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';
import CruImported from './components/CruImported.vue';
import { Component } from 'vue';
import { mapDriver } from '@shell/store/plugins';
/**
 * We need to have different provisioners for these cases because they need to behave differently
 * ie we want to hide local and imported provisioners from create/import wizards, but they are used as type options
 * during cluster edit (shell/edit/provisioning.cattle.io.cluster/index.vue). On the other hand, 'generic' import provisioner
 * should be shown as available type on cluster import only.
 * Provisioner also determines what we show in ResourceDetail's Masthead. ie we don't want to show "Imported" when importing
 * a generic cluster, since is hasn't been imported yet.
 */

/**
 * ImportedProvisioner handles editing already imported generic cluster.
 * We want to hide it from both create and import wizards, so hidden is set to true.
 * It is a part of the kontainer group, because we want edit to be available if either RKE2 or RKE1 is selected in create wizard.
 */
export class ImportedProvisioner implements IClusterProvisioner {
  static ID = 'imported'

  get id(): string {
    return ImportedProvisioner.ID;
  }

  get component(): Component {
    return CruImported;
  }

  get detailTabs(): any {
    return {};
  }

  get hidden(): boolean {
    return true;
  }

  get group(): string {
    return 'kontainer';
  }
}

/**
 * ImportProvisioner is used to import a new generic cluster.
 * We want to hide it from create wizards, but not from import wizard, so hideCreate is set to true.
 * It is a part of the kontainer group, because we want import to be available if either RKE2 or RKE1 is selected in create wizard.
 */
export class ImportProvisioner implements IClusterProvisioner {
    static ID = 'generic-import'

    constructor(private context: ClusterProvisionerContext) {
      mapDriver(this.id, 'generic' );
    }

    get id(): string {
      return ImportProvisioner.ID;
    }

    get component(): Component {
      return CruImported;
    }

    get detailTabs(): any {
      return {};
    }

    get label(): string {
      return this.context.t('import.label');
    }

    get showImport(): boolean {
      return true;
    }

    get group(): string {
      return 'custom';
    }

    get icon(): any {
      return require('./assets/generic.svg');
    }

    get hideCreate(): boolean {
      return true;
    }
}

/**
 * LocalProvisioner edits a local cluster.
 * We want to hide it from both create and import wizards, so hidden is set to true.
 * it is a part of the kontainer group, because we want edit to be available if either RKE2 or RKE1 is selected in create wizard.
 */
export class LocalProvisioner implements IClusterProvisioner {
    static ID = 'local'

    get id(): string {
      return LocalProvisioner.ID;
    }

    get component(): Component {
      return CruImported;
    }

    get detailTabs(): any {
      return {};
    }

    get hidden(): boolean {
      return true;
    }

    get group(): string {
      return 'kontainer';
    }
}
