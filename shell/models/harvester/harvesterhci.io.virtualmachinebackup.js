import { HCI } from '@shell/config/types';
import { get } from '@shell/utils/object';
import { findBy } from '@shell/utils/array';
import { colorForState } from '@shell/plugins/dashboard-store/resource-class';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class HciVmBackup extends SteveModel {
  detailPageHeaderActionOverride() {
    return this.t('harvester.backup.title');
  }

  get _availableActions() {
    const toFilter = ['goToEdit', 'cloneYaml', 'goToClone', 'download'];

    const out = super._availableActions.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    const schema = this.$getters['schemaFor'](HCI.VM);
    let canCreateVM = true;

    if ( schema && !schema?.collectionMethods.find(x => ['post'].includes(x.toLowerCase())) ) {
      canCreateVM = false;
    }

    return [
      {
        action:     'restoreExistingVM',
        enabled:    canCreateVM && this.attachVmExisting && this?.status?.readyToUse,
        icon:       'icons icon-refresh',
        label:      this.t('harvester.action.restoreExistingVM'),
      },
      {
        action:     'restoreNewVM',
        enabled:    canCreateVM && this?.status?.readyToUse,
        icon:       'icons icon-backup',
        label:      this.t('harvester.action.restoreNewVM'),
      },
      ...out
    ];
  }

  restoreExistingVM(resource = this) {
    const router = this.currentRouter();

    router.push({
      name:   `c-cluster-product-resource-create`,
      params: { resource: HCI.BACKUP },
      query:  { restoreMode: 'existing', backupName: resource.name }
    });
  }

  restoreNewVM(resource = this) {
    const router = this.currentRouter();

    router.push({
      name:   `c-cluster-product-resource-create`,
      params: { resource: HCI.BACKUP },
      query:  { restoreMode: 'new', backupName: resource.name }
    });
  }

  get state() {
    let out = 'Pending';
    const conditions = get(this, 'status.conditions');
    const isProgress = findBy(conditions, 'type', 'InProgress')?.status === 'True';
    const isReady = findBy(conditions, 'type', 'Ready')?.status === 'True';

    if (this?.status?.readyToUse) {
      out = 'Ready';
    } else if (isProgress) {
      out = 'Progressing';
    } else if (!isReady) {
      out = 'error';
    }

    return out;
  }

  get stateColor() {
    const state = this.state;

    return colorForState(state);
  }

  get attachVM() {
    return this.spec.source.name;
  }

  get backupContentName() {
    return this?.status?.virtualMachineBackupContentName || '';
  }

  get backupTarget() {
    return this?.status?.backupTarget?.endpoint || '';
  }

  get attachVmExisting() {
    const vmList = this.$rootGetters['harvester/all'](HCI.VM);

    return !!vmList.find( V => V.metadata.name === this.attachVM);
  }

  remove() {
    const opt = { ...arguments };

    opt.params = { propagationPolicy: 'Foreground' };

    return this._remove(opt);
  }
}
