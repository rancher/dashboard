import HarvesterResource from './harvester';

export default class HciVmRestore extends HarvesterResource {
  get isComplete() {
    return this?.status?.complete || false;
  }

  get pvcNames() {
    const restores = this?.status?.restores || [];
    const out = restores.map( O => O?.persistentVolumeClaimSpec?.name);

    return out;
  }

  get customValidationRules() {
    const isNew = this.spec?.newVM;

    const rules = [{
      nullable:       false,
      path:           'spec.target.name',
      required:       true,
      minLength:      1,
      maxLength:      63,
      translationKey: 'harvester.fields.virtualName',
    }, {
      nullable:       false,
      path:           'spec.virtualMachineBackupName',
      required:       true,
      translationKey: 'harvester.backup.restore.backup',
    }];

    if (!isNew) {
      rules.push({
        path:           'spec.deletionPolicy',
        required:       true,
        type:           'string',
        translationKey: 'harvester.backup.restore.deletePreviousVolumes',
      });
    }

    return rules;
  }
}
