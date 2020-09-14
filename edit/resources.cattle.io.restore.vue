<script>
import CruResource from '@/components/CruResource';
import createEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/form/LabeledInput';
import UnitInput from '@/components/form/UnitInput';
import Checkbox from '@/components/form/Checkbox';
import FileSelector from '@/components/form/FileSelector';
import LabeledSelect from '@/components/form/LabeledSelect';
import Banner from '@/components/Banner';
import RadioGroup from '@/components/form/RadioGroup';
import { mapGetters } from 'vuex';
import { SECRET, BACKUP_RESTORE, CATALOG } from '@/config/types';
import { allHash } from '@/utils/promise';
import { get, isEmpty } from '@/utils/object';
export default {

  components: {
    CruResource,
    UnitInput,
    LabeledInput,
    Checkbox,
    FileSelector,
    LabeledSelect,
    Banner,
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
  },

  data() {
    if (!this.value.spec) {
      this.$set(this.value, 'spec', { prune: true, deleteTimeoutSeconds: 10 });
    }
    if (!this.value.spec.storageLocation) {
      this.$set(this.value.spec, 'storageLocation', { s3: {} });
    }
    if (!this.value.metadata.name) {
      this.value.metadata.generateName = 'restore-';
    }
    const s3 = this.value.spec.storageLocation.s3;

    return {
      allSecrets: [], allBackups: [], s3, targetBackup: null, storageSource: 'useDefault', releases: []
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

    namespacedBackups() {
      return this.allBackups.filter(backup => backup.namespace === this.value?.metadata?.namespace);
    },

    showWarning() {
      return this.isEncrypted && !this.value.spec.encryptionConfigName;
    },

    isEncrypted() {
      return !!((this.value.spec.backupFilename || '').match(/.*\.enc$/));
    },

    radioOptions() {
      const options = ['useDefault', 'configureS3'];
      const labels = [this.t('backupRestoreOperator.storageSource.useDefault'), this.t('backupRestoreOperator.storageSource.configureS3')];

      if (this.targetBackup && !isEmpty(get(this.targetBackup, 'spec.storageLocation.s3'))) {
        options.push('useBackup');
        labels.push( this.t('backupRestoreOperator.storageSource.useBackup'));
      }

      return { options, labels };
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  methods: {
    updateTargetBackup(neu) {
      if (get(neu, 'spec.storageLocation.s3') && this.locationSource === 'useBackup') {
        Object.assign(this.value.spec.storageLocation.s3, neu.spec.storageLocation.s3);
      }
      this.$set(this.value.spec, 'backupFileName', neu.status.filename);
      this.$set(this.value.spec, 'encryptionConfigName', neu.spec.encryptionConfigName);
      this.targetBackup = neu;
    }
  }

};
</script>

<template>
  <div>
    <CruResource :validation-passed="!!value.spec.backupFilename && !!value.spec.backupFilename.length" :done-route="doneRoute" :resource="value" :mode="mode" @finish="save">
      <template>
        <div class="bordered-section">
          <Banner v-if="showWarning" color="warning" :label="t('backupRestoreOperator.encryptionConfigName.tip')" />
          <div class="row mb-10">
            <div class="col span-6">
              <LabeledSelect
                :disabled="!namespacedBackups.length"
                :value="targetBackup"
                :options="namespacedBackups"
                :mode="mode"
                option-label="metadata.name"
                :label="t('backupRestoreOperator.targetBackup')"
                @input="updateTargetBackup"
              />
            </div>
            <div class="col span-6">
              <LabeledInput v-model="value.spec.backupFilename" required :mode="mode" :label="t('backupRestoreOperator.backupFilename')" />
            </div>
          </div>
          <div :style="{'align-items':'center'}" class="row mb-10">
            <div class="col span-6">
              <UnitInput v-model="value.spec.deleteTimeoutSeconds" :suffix="t('suffix.seconds')" :mode="mode" :label="t('backupRestoreOperator.deleteTimeout')" />
            </div>
            <div class="col span-6">
              <LabeledSelect v-model="value.spec.encryptionConfigName" :disabled="!isEncrypted" :mode="mode" :options="encryptionSecretNames" :label="t('backupRestoreOperator.encryptionConfigName.label')" />
            </div>
          </div>
          <div :style="{'align-items':'center'}" class="row">
            <div class="col span-12">
              <Checkbox v-model="value.spec.prune" :label="t('backupRestoreOperator.prune.label')" :mode="mode" />
              <div class="text-muted">
                {{ t('backupRestoreOperator.prune.tip') }}
              </div>
            </div>
          </div>
        </div>

        <div class="row mb-10">
          <div class="col span-12">
            <RadioGroup
              v-model="storageSource"
              name="storageSource"
              :label="t('backupRestoreOperator.s3.titles.location')"
              :options="radioOptions.options"
              :labels="radioOptions.labels"
            />
          </div>
        </div>

        <template v-if="storageSource !== 'useDefault'">
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
      </template>
    </CruResource>
  </div>
</template>
