import { IClusterProvisioner } from '@shell/core/types';
import CruImported from './components/CruImported.vue';
import { Component } from 'vue';

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
