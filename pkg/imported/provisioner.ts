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
 * EditImportedGenericCluster handles editing already imported generic cluster.
 */
export class EditImportedGenericCluster implements IClusterProvisioner {
  static ID = 'imported'

  get id(): string {
    return EditImportedGenericCluster.ID;
  }

  get component(): Component {
    return CruImported;
  }

  get detailTabs(): any {
    return {};
  }

  // Since it is only used for edit, we want to hide it from both create and import wizards
  get hidden(): boolean {
    return true;
  }

  // It is not rke2-specific and we want to have it available independently from RKE2 or RKE1 toggle
  get group(): string {
    return 'kontainer';
  }
}

/**
 * ImportGenericCluster is used to import a new generic cluster.
 */
export class ImportGenericCluster implements IClusterProvisioner {
    static ID = 'import'

    constructor(private context: ClusterProvisionerContext) {
      mapDriver(this.id, 'generic' );
    }

    get id(): string {
      return ImportGenericCluster.ID;
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

    // We want to show it in the import wizard only and hide it on create
    get showImport(): boolean {
      return true;
    }

    get hideCreate(): boolean {
      return true;
    }

    // It is not rke2-specific and we want to have it available independently from RKE2 or RKE1 toggle
    get group(): string {
      return 'custom';
    }

    get icon(): any {
      return require('./assets/generic.svg');
    }
}

/**
 * EditLocalCluster edits a local cluster.
 */
export class EditLocalCluster implements IClusterProvisioner {
    static ID = 'local'

    get id(): string {
      return EditLocalCluster.ID;
    }

    get component(): Component {
      return CruImported;
    }

    get detailTabs(): any {
      return {};
    }

    // Since it is only used for edit, we want to hide it from both create and import wizards
    get hidden(): boolean {
      return true;
    }

    // It is not rke2-specific and we want to have it available independently from RKE2 or RKE1 toggle
    get group(): string {
      return 'kontainer';
    }
}
