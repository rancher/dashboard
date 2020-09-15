<script>
import CruResource from '@/components/CruResource';
import createEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/form/LabeledInput';
import UnitInput from '@/components/form/UnitInput';
import Checkbox from '@/components/form/Checkbox';
import FileSelector from '@/components/form/FileSelector';
import LabeledSelect from '@/components/form/LabeledSelect';
import Loading from '@/components/Loading';
import RadioGroup from '@/components/form/RadioGroup';
import { mapGetters } from 'vuex';
import { SECRET, BACKUP_RESTORE, CATALOG } from '@/config/types';
import { allHash } from '@/utils/promise';
import { get } from '@/utils/object';
export default {

  components: {
    CruResource,
    UnitInput,
    LabeledInput,
    Checkbox,
    FileSelector,
    LabeledSelect,
    Loading,
    RadioGroup
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
      secrets:  this.$store.dispatch('cluster/findAll', { type: SECRET }),
      backups:  this.$store.dispatch('cluster/findAll', { type: BACKUP_RESTORE.BACKUP }),
      releases: this.$store.dispatch('cluster/findAll', { type: CATALOG.RELEASE })
    });

    this.allSecrets = hash.secrets;
    this.allBackups = hash.backups;
    this.releases = hash.releases;

    if (hash.backups.length) {
      this.storageSource = 'useBackup';
    }
  },

  data() {
    if (!this.value.spec) {
      this.$set(this.value, 'spec', { prune: true, deleteTimeoutSeconds: 10 });
    }

    if (!this.value.metadata.name) {
      this.value.metadata.generateName = 'restore-';
    }

    return {
      allSecrets: [], allBackups: [], s3: {}, targetBackup: null, storageSource: 'useDefault', releases: []
    };
  },

  computed: {
    chartNamespace() {
      const BRORelease = this.releases.filter(release => get(release, 'spec.name') === 'backup-restore-operator')[0];

      return BRORelease ? BRORelease.spec.namespace : '';
    },

    credentialSecret: {
      get() {
        const { credentialSecretName, credentialSecretNamespace } = this.s3;

        return { metadata: { name: credentialSecretName, namespace: credentialSecretNamespace } };
      },

      set(neu) {
        const { name, namespace } = neu.metadata;

        this.$set(this.s3, 'credentialSecretName', name);
        this.$set(this.s3, 'credentialSecretNamespace', namespace);
      }
    },

    encryptionSecretNames() {
      return this.allSecrets.filter(secret => !!secret.data['encryption-provider-config.yaml'] && secret.metadata.namespace === this.chartNamespace).map(secret => secret.metadata.name);
    },

    isEncrypted() {
      return !!((this.value.spec.backupFilename || '').match(/.*\.enc$/));
    },

    radioOptions() {
      const options = ['useDefault', 'configureS3'];
      const labels = [this.t('backupRestoreOperator.restoreFrom.default'), this.t('backupRestoreOperator.restoreFrom.s3')];

      if (this.allBackups.length) {
        options.unshift('useBackup');
        labels.unshift( this.t('backupRestoreOperator.restoreFrom.existing'));
      }

      return { options, labels };
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  watch: {
    storageSource(neu, old) {
      if (neu === 'useDefault') {
        delete this.value.spec.storageLocation;
      } else if (!this.value.spec.storageLocation) {
        this.$set(this.value.spec, 'storageLocation', { s3: {} });
        this.s3 = this.value.spec.storageLocation.s3;
      }
      if (neu === 'useBackup') {
        if (this.allBackups.length === 1) {
          this.updateTargetBackup(this.allBackups[0]);
        }
      } else if (this.targetBackup) {
        if (get(this.targetBackup, 'spec.storageLocation.s3')) {
          Object.assign(this.value.spec.storageLocation.s3, this.targetBackup.spec.storageLocation.s3);
        }
        this.$set(this.value.spec, 'backupFilename', this.targetBackup.status.filename);
        if (this.targetBackup.spec.encryptionConfigName) {
          this.$set(this.value.spec, 'encryptionConfigName', this.targetBackup.spec.encryptionConfigName);
        }
      }
    }
  },

  methods: {
    updateTargetBackup(neu) {
      if (get(neu, 'spec.storageLocation.s3')) {
        Object.assign(this.value.spec.storageLocation.s3, neu.spec.storageLocation.s3);
      }
      this.$set(this.value, 'spec', { ...this.value.spec, backupFilename: neu.status.filename });

      if (neu.spec.encryptionConfigName) {
        this.$set(this.value, 'spec', { ...this.value.spec, encryptionConfigName: neu.spec.encryptionConfigName });
      }
      this.targetBackup = neu;
    }
  }

};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />

    <CruResource :validation-passed="!!value.spec.backupFilename && !!value.spec.backupFilename.length" :done-route="doneRoute" :resource="value" :mode="mode" @finish="save">
      <template>
        <div class="bordered-section">
          <div class="row mb-10">
            <div class="col span-12">
              <RadioGroup
                v-model="storageSource"
                name="storageSource"
                :label="t('backupRestoreOperator.s3.titles.backupLocation')"
                :options="radioOptions.options"
                :labels="radioOptions.labels"
              />
            </div>
          </div>
          <template v-if="storageSource === 'configureS3'">
            <div class="row mb-10">
              <div class="col span-6">
                <LabeledSelect
                  v-model="credentialSecret"
                  :get-option-label="opt=>opt.metadata.name || ''"
                  :mode="mode"
                  :options="allSecrets"
                  :label="t('backupRestoreOperator.s3.credentialSecretName')"
                />
              </div>
              <div class="col span-6">
                <LabeledInput v-model="s3.bucketName" :mode="mode" :label="t('backupRestoreOperator.s3.bucketName')" />
              </div>
            </div>
            <div class="row mb-10">
              <div class="col span-6">
                <LabeledInput v-model="s3.region" :mode="mode" :label="t('backupRestoreOperator.s3.region')" />
              </div>
              <div class="col span-6">
                <LabeledInput v-model="s3.folder" :mode="mode" :label="t('backupRestoreOperator.s3.folder')" />
              </div>
            </div>
            <div class="row mb-10">
              <div class="col span-6">
                <LabeledInput v-model="s3.endpoint" :mode="mode" :label="t('backupRestoreOperator.s3.endpoint')" />
                <Checkbox v-model="s3.insecureTLSSkipVerify" class="mt-10" :mode="mode" :label="t('backupRestoreOperator.s3.insecureTLSSkipVerify')" />
              </div>
              <div class="col span-6">
                <LabeledInput v-model="s3.endpointCA" :mode="mode" type="multiline" :label="t('backupRestoreOperator.s3.endpointCA')" />
                <FileSelector v-if="mode!=='view'" class="btn btn-sm role-primary mt-5" :mode="mode" :label="t('generic.readFromFile')" @selected="e=>$set(s3, 'endpointCA', e)" />
              </div>
            </div>
          </template>
          <div v-else-if="storageSource==='useBackup'" class="row mb-10">
            <div class="col span-6">
              <LabeledSelect
                :disabled="!allBackups.length"
                :value="targetBackup"
                :options="allBackups"
                :mode="mode"
                option-label="metadata.name"
                :label="t('backupRestoreOperator.targetBackup')"
                @input="updateTargetBackup"
              />
            </div>
          </div>
        </div>

        <div>
          <div :style="{'align-items':'center'}" class="row mb-10">
            <div class="col span-6">
              <LabeledInput v-model="value.spec.backupFilename" :spellcheck="false" required :mode="mode" :label="t('backupRestoreOperator.backupFilename')" />
            </div>
            <div class="col span-6">
              <LabeledSelect
                v-if="isEncrypted"
                v-model="value.spec.encryptionConfigName"
                status="warning"
                :tooltip="t('backupRestoreOperator.encryptionConfigName.tip')"
                :hover-tooltip="true"
                :mode="mode"
                :options="encryptionSecretNames"
                :label="t('backupRestoreOperator.encryptionConfigName.label')"
              />
            </div>
          </div>
          <div :style="{'align-items':'center'}" class="row">
            <div class="col span-6">
              <UnitInput v-model="value.spec.deleteTimeoutSeconds" :suffix="t('suffix.seconds')" :mode="mode" :label="t('backupRestoreOperator.deleteTimeout.label')">
                <template #label>
                  <label v-tooltip="t('backupRestoreOperator.deleteTimeout.tip')" class="has-tooltip">
                    {{ t('backupRestoreOperator.deleteTimeout.label') }} <i class="icon icon-info" />
                  </label>
                </template>
              </UnitInput>
            </div>
            <div class="col span-6">
              <Checkbox v-model="value.spec.prune" :label="t('backupRestoreOperator.prune.label')" :mode="mode">
                <template #label>
                  <span v-tooltip="t('backupRestoreOperator.prune.tip')" class="text-label">
                    {{ t('backupRestoreOperator.prune.label') }} <i class="icon icon-info" />
                  </span>
                </template>
              </Checkbox>
            </div>
          </div>
        </div>
      </template>
    </CruResource>
  </div>
</template>
