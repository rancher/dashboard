import { IClusterProvisioner, ClusterProvisionerContext } from '@shell/core/types';
import CruImported from './components/CruImported.vue';
import { mapDriver } from '@shell/store/plugins';
import { Component } from 'vue';

export class ImportedProvisioner implements IClusterProvisioner {
  static ID = 'imported'

  constructor(private context: ClusterProvisionerContext) {
    mapDriver(this.id, 'imported' );
  }

  get id(): string {
    return ImportedProvisioner.ID;
  }

  get label(): string {
    return this.context.t('imported.label');
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
}

export class LocalProvisioner implements IClusterProvisioner {
    static ID = 'local'

    constructor(private context: ClusterProvisionerContext) {
      mapDriver(this.id, 'imported' );
    }

    get id(): string {
      return LocalProvisioner.ID;
    }

    get label(): string {
      return this.context.t('imported.label');
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
}
