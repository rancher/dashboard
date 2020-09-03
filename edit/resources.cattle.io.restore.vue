<script>
import CruResource from '@/components/CruResource';
import NameNsDescription from '@/components/form/NameNsDescription';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import createEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/form/LabeledInput';
import UnitInput from '@/components/form/UnitInput';
import Checkbox from '@/components/form/Checkbox';
import FileSelector from '@/components/form/FileSelector';
import LabeledSelect from '@/components/form/LabeledSelect';
import Labels from '@/components/form/Labels';
import Banner from '@/components/Banner';
import { mapGetters } from 'vuex';
import { SECRET, BACKUP_RESTORE } from '@/config/types';
import { allHash } from '@/utils/promise';
import { get } from '@/utils/object';
export default {

  components: {
    CruResource,
    Tabbed,
    Tab,
    UnitInput,
    LabeledInput,
    Checkbox,
    NameNsDescription,
    FileSelector,
    LabeledSelect,
    Labels,
    Banner
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
    const hash = await allHash({
      secrets: this.$store.dispatch('cluster/findAll', { type: SECRET }),
      backups: this.$store.dispatch('cluster/findAll', { type: BACKUP_RESTORE.BACKUP })
    });

    this.allSecrets = hash.secrets;
    this.allBackups = hash.backups;
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
      allSecrets: [], allBackups: [], s3, targetBackup: null
    };
  },

  computed: {
    namespacedSecretNames() {
      return this.allSecrets.filter(secret => secret.namespace === this.value?.metadata?.namespace).map(secret => secret.metadata.name);
    },

    namespacedBackups() {
      return this.allBackups.filter(backup => backup.namespace === this.value?.metadata?.namespace);
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  methods: {
    updateTargetBackup(neu) {
      if (get(neu, 'spec.storageLocation.s3')) {
        Object.assign(this.value.spec.storageLocation.s3, neu.spec.storageLocation.s3);
      }
      this.targetBackup = neu;
    }
  }

};
</script>

<template>
  <div>
    <CruResource :validation-passed="!!value.spec.backupFilename && !!value.spec.backupFilename.length" :done-route="doneRoute" :resource="value" :mode="mode" @finish="save">
      <template #define>
        <NameNsDescription v-model="value" :mode="mode">
          <template v-if="mode==='create'" v-slot:namespace="{namespaces}">
            <LabeledSelect v-model="value.metadata.namespace" label="Namespace" :options="namespaces" />
          </template>
        </NameNsDescription>
        <Tabbed :side-tabs="true">
          <Tab name="storageLocation" :label="t('backupRestoreOperator.s3.titles.location')">
            <div class="bordered-section">
              <Banner color="warning" :label="t('backupRestoreOperator.encryptionConfigName.tip')" />
              <div class="row mb-10">
                <div class="col span-6">
                  <LabeledSelect
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
                  <LabeledSelect v-model="value.spec.encryptionConfigName" :mode="mode" :options="namespacedSecretNames" :label="t('backupRestoreOperator.encryptionConfigName.label')" />
                </div>
              </div>
              <div :style="{'align-items':'center'}" class="row">
                <div class="col span-6">
                  <Checkbox v-model="value.spec.prune" :mode="mode" :label="t('backupRestoreOperator.prune')" />
                </div>
              </div>
            </div>
            <h3>{{ t('backupRestoreOperator.s3.titles.s3') }}</h3>

            <div class="row mb-10">
              <div class="col span-6">
                <LabeledSelect v-model="s3.credentialSecretName" :mode="mode" :options="namespacedSecretNames" :label="t('backupRestoreOperator.s3.credentialSecretName')" />
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
                <Checkbox v-model="s3.insecureTLSSkipVerify" :mode="mode" :label="t('backupRestoreOperator.s3.insecureTLSSkipVerify')" />
              </div>
              <div class="col span-6">
                <LabeledInput v-model="s3.endpointCA" :mode="mode" type="multiline" :label="t('backupRestoreOperator.s3.endpointCA')" />
                <FileSelector v-if="mode!=='view'" class="btn btn-sm role-primary mt-5" :mode="mode" :label="t('generic.readFromFile')" @selected="e=>$set(s3, 'endpointCA', e)" />
              </div>
            </div>
          </Tab>
          <Tab name="labelsAndAnnotations" :label="t('generic.labelsAndAnnotations')">
            <Labels v-model="value" :mode="mode" />
          </Tab>
        </Tabbed>
      </template>
    </CruResource>
  </div>
</template>
