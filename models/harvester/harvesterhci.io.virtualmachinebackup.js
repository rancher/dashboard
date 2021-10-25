import { HCI } from '@/config/types';
import { get } from '@/utils/object';
import { findBy } from '@/utils/array';
import { colorForState } from '@/plugins/core-store/resource-instance';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';

export default {
  detailPageHeaderActionOverride() {
    return () => {
      return this.t('harvester.backup.title');
    };
  },
  _availableActions() {
    const toFilter = ['goToEdit', 'cloneYaml', 'goToClone', 'download'];

    const out = this._standardActions.filter((action) => {
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
  },

  restoreExistingVM() {
    return (resource = this) => {
      const router = this.currentRouter();

      router.push({
        name:   `c-cluster-product-resource-create`,
        params: { resource: HCI.BACKUP },
        query:  { restoreMode: 'existing', backupName: resource.name }
      });
    };
  },

  restoreNewVM() {
    return (resource = this) => {
      const router = this.currentRouter();

      router.push({
        name:   `c-cluster-product-resource-create`,
        params: { resource: HCI.BACKUP },
        query:  { restoreMode: 'new', backupName: resource.name }
      });
    };
  },

  state() {
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
  },

  stateColor() {
    const state = this.state;

    return colorForState(state);
  },

  attachVM() {
    return this.spec.source.name;
  },

  backupContentName() {
    return this?.status?.virtualMachineBackupContentName || '';
  },

  backupTarget() {
    return get(this, `metadata.annotations."${ HCI_ANNOTATIONS.BACKUP_TARGET }"`) || '';
  },

  isMatchWithCurrentBakcupTarget() {
    const allSetting = this.$rootGetters['harvester/all'](HCI.SETTING);
    const backupTargetResource = allSetting.find( O => O.id === 'backup-target');

    return this.backupTarget === backupTargetResource?.parseValue?.endpoint;
  },

  attachVmExisting() {
    const vmList = this.$rootGetters['harvester/all'](HCI.VM);

    return !!vmList.find( V => V.metadata.name === this.attachVM);
  }
};
