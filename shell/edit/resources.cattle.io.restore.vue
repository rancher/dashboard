<script>
import CruResource from '@shell/components/CruResource';
import createEditView from '@shell/mixins/create-edit-view';
import LabeledInput from '@shell/components/form/LabeledInput';
import UnitInput from '@shell/components/form/UnitInput';
import Checkbox from '@shell/components/form/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Loading from '@shell/components/Loading';
import RadioGroup from '@shell/components/form/RadioGroup';
import S3 from '@shell/chart/rancher-backup/S3';
import { mapGetters } from 'vuex';
import { SECRET, BACKUP_RESTORE, CATALOG } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { get } from '@shell/utils/object';
import { _CREATE } from '@shell/config/query-params';
export default {

  components: {
    CruResource,
    UnitInput,
    LabeledInput,
    Checkbox,
    S3,
    LabeledSelect,
    Loading,
    RadioGroup,
  },

  mixins: [createEditView],

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: 'create'
    }
  },

  async fetch() {
    await this.$store.dispatch('catalog/load');

    const hash = await allHash({
      secrets: this.$store.dispatch('cluster/findAll', { type: SECRET }),
      backups: this.$store.dispatch('cluster/findAll', { type: BACKUP_RESTORE.BACKUP }),
      apps:    this.$store.dispatch('cluster/findAll', { type: CATALOG.APP })
    });

    this.allSecrets = hash.secrets;
    this.allBackups = hash.backups;
    this.apps = hash.apps;
  },

  data() {
    if (!this.value.spec) {
      this.$set(this.value, 'spec', { prune: true, deleteTimeoutSeconds: 10 });
    }

    if (!this.value.metadata.name) {
      this.value.metadata.generateName = 'restore-';
    }

    let s3 = {};
    let storageSource = 'useDefault';

    if (this.value?.spec?.storageLocation?.s3) {
      storageSource = 'configureS3';
      s3 = this.value.spec.storageLocation.s3;
    }

    return {
      allSecrets: [], allBackups: [], s3, targetBackup: null, storageSource, apps: []
    };
  },

  computed: {
    isClone() {
      return this.mode === _CREATE && !!this.liveValue.id;
    },

    availableBackups() {
      return this.allBackups.filter(backup => backup.state !== 'error');
    },

    chartNamespace() {
      const BRORelease = this.apps.filter(release => get(release, 'spec.name') === 'rancher-backup')[0];

      return BRORelease ? BRORelease.spec.namespace : '';
    },

    encryptionSecretNames() {
      return this.allSecrets.filter(secret => !!(secret.data || {})['encryption-provider-config.yaml'] && secret.metadata.namespace === this.chartNamespace && !secret.metadata?.state?.error).map(secret => secret.metadata.name);
    },

    isEncrypted() {
      return !!((this.value.spec.backupFilename || '').match(/.*\.enc$/));
    },

    radioOptions() {
      const options = ['useDefault', 'configureS3'];
      const labels = [this.t('backupRestoreOperator.restoreFrom.default'), this.t('backupRestoreOperator.restoreFrom.s3')];

      if (this.availableBackups.length || this.storageSource === 'useBackup') {
        options.unshift('useBackup');
        labels.unshift( this.t('backupRestoreOperator.restoreFrom.existing'));
      }

      return { options, labels };
    },

    validationPassed() {
      const hasBackupFile = (!!this.value.spec.backupFilename && !!this.value.spec.backupFilename.length);
      const hasEncryption = !!this.value.spec.encryptionConfigSecretName;

      if (!hasBackupFile) {
        return false;
      }

      return !this.isEncrypted || hasEncryption;
    },

    targetBackupFilename() {
      return get(this.targetBackup, 'status.filename');
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  watch: {
    storageSource(neu, old) {
      if (neu === 'useDefault') {
        delete this.value.spec.storageLocation;
        delete this.value.spec.backupFilename;
      } else if (!this.value.spec.storageLocation && neu === 'configureS3') {
        this.$set(this.value.spec, 'storageLocation', { s3: {} });
        this.s3 = this.value.spec.storageLocation.s3;
      }
      if (neu === 'useBackup') {
        delete this.value.spec.storageLocation;

        if (this.availableBackups.length === 1) {
          this.updateTargetBackup(this.availableBackups[0]);
        }
      } else {
        delete this.value.spec.backupFilename;
        this.value.spec.storageLocation = { s3: this.s3 };
      }
    },

    availableBackups(neu, old) {
      if ((neu.length && !old.length) && !this.isClone && this.mode !== 'view') {
        this.storageSource = 'useBackup';
      }
    },

    targetBackupFilename(neu) {
      this.value.spec.backupFilename = neu;
    }
  },

  methods: {
    updateTargetBackup(neu) {
      const out = { backupFilename: neu?.status?.filename };

      if (neu?.spec?.storageLocation?.s3) {
        out.storageLocation = neu.spec.storageLocation;
      } else {
        delete this.value.spec.storageLocation;
      }
      if (neu.spec.encryptionConfigSecretName && this.encryptionSecretNames.includes(neu.spec.encryptionConfigSecretName)) {
        out.encryptionConfigSecretName = neu.spec.encryptionConfigSecretName;
      }
      this.$set(this.value, 'spec', { ...this.value.spec, ...out });

      this.targetBackup = neu;
    }
  }

};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />

    <CruResource :validation-passed="validationPassed" :done-route="doneRoute" :resource="value" :mode="mode" @finish="save">
      <template>
        <div>
          <div class="row mb-10">
            <div class="col span-12">
              <RadioGroup
                v-model="storageSource"
                name="storageSource"
                :label="t('backupRestoreOperator.s3.titles.backupLocation')"
                :options="radioOptions.options"
                :labels="radioOptions.labels"
                :mode="mode"
              />
            </div>
          </div>
          <template v-if="storageSource === 'configureS3'">
            <S3 v-model="s3" :mode="mode" :secrets="allSecrets" />
          </template>
          <div v-else-if="storageSource==='useBackup'" class="row mb-10">
            <div class="col span-6">
              <LabeledSelect
                :disabled="!availableBackups.length"
                :value="targetBackup"
                :options="availableBackups"
                :mode="mode"
                option-label="metadata.name"
                :label="t('backupRestoreOperator.targetBackup')"
                @input="updateTargetBackup"
              />
            </div>
          </div>
        </div>
        <div class="spacer"></div>

        <div>
          <div :style="{'align-items':'center'}" class="row mb-10">
            <div class="col span-6">
              <LabeledInput v-model="value.spec.backupFilename" :spellcheck="false" required :mode="mode" :label="t('backupRestoreOperator.backupFilename')" />
            </div>
            <div class="col span-6">
              <LabeledSelect
                v-if="isEncrypted"
                v-model="value.spec.encryptionConfigSecretName"
                :status="mode === 'view' ? null : 'warning'"
                :tooltip="mode === 'view' ? null : t('backupRestoreOperator.encryptionConfigName.restoretip')"
                :hover-tooltip="true"
                :mode="mode"
                :options="encryptionSecretNames"
                :label="t('backupRestoreOperator.encryptionConfigName.label')"
              />
            </div>
          </div>
          <div :style="{'align-items':'center'}" class="row">
            <div class="col span-6">
              <Checkbox v-model="value.spec.prune" class="mb-5" :label="t('backupRestoreOperator.prune.label')" :mode="mode">
                <template #label>
                  <span v-tooltip="t('backupRestoreOperator.prune.tip')" class="text-label">
                    {{ t('backupRestoreOperator.prune.label') }} <i class="icon icon-info" />
                  </span>
                </template>
              </Checkbox>
              <UnitInput v-if="value.spec.prune" v-model="value.spec.deleteTimeoutSeconds" :suffix="t('suffix.seconds', {count: value.spec.deleteTimeoutSeconds})" :mode="mode" :label="t('backupRestoreOperator.deleteTimeout.label')">
                <template #label>
                  <label v-tooltip="t('backupRestoreOperator.deleteTimeout.tip')" class="has-tooltip">
                    {{ t('backupRestoreOperator.deleteTimeout.label') }} <i class="icon icon-info" />
                  </label>
                </template>
              </UnitInput>
            </div>
          </div>
        </div>
      </template>
    </CruResource>
  </div>
</template>
