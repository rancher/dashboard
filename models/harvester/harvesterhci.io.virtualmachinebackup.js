import { HCI } from '@/config/types';
import { get } from '@/utils/object';
import { findBy } from '@/utils/array';
import { colorForState } from '@/plugins/steve/resource-class';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';
import SteveModel from '@/plugins/steve/steve-class';

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

    return [
      {
        action:     'restoreExistingVM',
        enabled:    this.attachVmExisting && this?.status?.readyToUse,
        icon:       'icons icon-h-restore-existing',
        label:      this.t('harvester.action.restoreExistingVM'),
      },
      {
        action:     'restoreNewVM',
        enabled:    this?.status?.readyToUse,
        icon:       'icons icon-h-restore-new',
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
    return get(this, `metadata.annotations."${ HCI_ANNOTATIONS.BACKUP_TARGET }"`) || '';
  }

  get attachVmExisting() {
    const vmList = this.$rootGetters['harvester/all'](HCI.VM);

    return !!vmList.find( V => V.metadata.name === this.attachVM);
  }
}
