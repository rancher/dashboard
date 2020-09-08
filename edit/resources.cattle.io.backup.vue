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
import NameNsDescription from '@/components/form/NameNsDescription';
import { mapGetters } from 'vuex';
import { SECRET, BACKUP_RESTORE } from '@/config/types';
import { allHash } from '@/utils/promise';
import { NAMESPACE } from '@/config/query-params';
import { sortBy } from '@/utils/sort';
export default {

  components: {
    CruResource,
    UnitInput,
    LabeledInput,
    Checkbox,
    FileSelector,
    LabeledSelect,
    RadioGroup,
    NameNsDescription,
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
      secrets:      this.$store.dispatch('cluster/findAll', { type: SECRET }),
      resourceSets: this.$store.dispatch('cluster/findAll', { type: BACKUP_RESTORE.RESOURCE_SET })
    });

    this.allSecrets = hash.secrets;
    this.allResourceSets = hash.resourceSets;
  },

  data() {
    if (!this.value.spec) {
      this.$set(this.value, 'spec', { retentionCount: 10 });
    }
    if (!this.value.spec.storageLocation) {
      this.$set(this.value.spec, 'storageLocation', { s3: {} });
    }
    const s3 = this.value.spec.storageLocation.s3;

    return {
      allSecrets: [], allResourceSets: [], s3, storageSource: 'useDefault', useEncryption: false
    };
  },

  computed: {
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
      return this.allSecrets.filter(secret => !!secret.data['encryption-provider-config.yaml'] && secret.metadata.namespace === 'cattle-resources-system').map(secret => secret.metadata.name);
    },

    namespacedResourceSetNames() {
      return this.allResourceSets.filter(set => set.namespace === this.value?.metadata?.namespace).map(set => set.metadata.name);
    },

    storageOptions() {
      const options = ['useDefault', 'configureS3'];
      const labels = [this.t('backupRestoreOperator.storageSource.useDefault'), this.t('backupRestoreOperator.storageSource.configureS3')];

      return { options, labels };
    },

    encryptionOptions() {
      const options = [false, true];
      const labels = [this.t('backupRestoreOperator.encryptionConfigName.options.none'), this.t('backupRestoreOperator.encryptionConfigName.options.secret', {}, true)];

      return { options, labels };
    },

    namespaces() {
      const choices = this.$store.getters['cluster/all'](NAMESPACE);
      const out = sortBy(choices.map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      }), 'label');

      return out;
    },

    resourceSetAvailable() {
      return !!this.namespacedResourceSetNames.length;
    },

    ...mapGetters({ t: 'i18n/t' })
  },
};
</script>

<template>
  <div>
    <CruResource :validation-passed="!!value.spec.resourceSetName && !!value.spec.resourceSetName.length" :done-route="doneRoute" :resource="value" :mode="mode" @finish="save">
      <template #define>
        <NameNsDescription :value="value" :namespaced="false" />
        <template v-if="resourceSetAvailable">
          <div class="bordered-section">
            <div class="row mb-10">
              <div class="col span-6">
                <LabeledSelect v-model="value.spec.resourceSetName" required :mode="mode" :options="namespacedResourceSetNames" :label="t('backupRestoreOperator.resourceSetName')" />
              </div>
              <div class="col span-6">
                <LabeledInput v-model="value.spec.schedule" :mode="mode" type="number" :label="t('backupRestoreOperator.schedule.label')" :placeholder="t('backupRestoreOperator.schedule.placeholder')" />
              </div>
            </div>
            <div class="row mb-10">
              <div class="col span-6">
                <UnitInput v-model="value.spec.retentionCount" :suffix="t('backupRestoreOperator.retentionCount.units', {count: value.spec.retentionCount || 0})" :mode="mode" :label="t('backupRestoreOperator.retentionCount.label')" />
              </div>
            </div>
          </div>

          <div class="bordered-section">
            <div class="row">
              <div class="col span-12">
                <RadioGroup v-model="useEncryption" :label="t('backupRestoreOperator.encryption')" :options="encryptionOptions.options" :labels="encryptionOptions.labels" />
              </div>
            </div>
            <div v-if="useEncryption" class="row mt-10">
              <div class="col span-6">
                <LabeledSelect v-model="value.spec.encryptionConfigName" :mode="mode" :options="encryptionSecretNames" :label="t('backupRestoreOperator.encryptionConfigName.label')" />
              </div>
            </div>
          </div>

          <div class="row mb-10">
            <div class="col span-12">
              <RadioGroup v-model="storageSource" :label="t('backupRestoreOperator.s3.titles.location')" :options="storageOptions.options" :labels="storageOptions.labels" />
            </div>
          </div>

          <template v-if="storageSource !== 'useDefault'">
            <div class="row mb-10">
              <div class="col span-6">
                <LabeledSelect v-model="credentialSecret" :get-option-label="opt=>opt.metadata.name || ''" :mode="mode" :options="allSecrets" :label="t('backupRestoreOperator.s3.credentialSecretName')" />
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
        <Banner v-else color="error">
          <span v-html="t('backupRestoreOperator.noResourceSet')" />
        </Banner>
      </template>
    </CruResource>
  </div>
</template>
