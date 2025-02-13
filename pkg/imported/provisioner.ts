import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';
import CruImported from './components/CruImported.vue';
import { Component } from 'vue';
import { mapDriver } from '@shell/store/plugins';
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

export class ImportProvisioner implements IClusterProvisioner {
    static ID = 'Generic'

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
