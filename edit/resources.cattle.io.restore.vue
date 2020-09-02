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
import { SECRET } from '@/config/types';
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
    this.allSecrets = await this.$store.dispatch('cluster/findAll', { type: SECRET });
  },

  data() {
    if (!this.value.spec) {
      this.$set(this.value, 'spec', { prune: true, deleteTimeoutSeconds: 10 });
    }
    if (!this.value.spec.storageLocation) {
      this.$set(this.value.spec, 'storageLocation', { s3: {} });
    }
    const s3 = this.value.spec.storageLocation.s3;

    return { allSecrets: [], s3 };
  },

  computed: {
    namespacedSecretNames() {
      return this.allSecrets.filter(secret => secret.namespace === this.value?.metadata?.namespace).map(secret => secret.metadata.name);
    },
    ...mapGetters({ t: 'i18n/t' })
  },

  created() {

  },
};
</script>

<template>
  <div>
    <CruResource :validation-passed="!!value.spec.backupFilename && !!value.spec.backupFilename.length" :done-route="doneRoute" :resource="value" :mode="mode" @finish="save">
      <template #define>
        <NameNsDescription v-model="value" :mode="mode" />
        <Tabbed :side-tabs="true">
          <Tab name="storageLocation" :label="t('backupRestoreOperator.restore.titles.location')">
            <div class="bordered-section">
              <div class="row mb-10">
                <div class="col span-6">
                  <LabeledInput v-model="value.spec.backupFilename" required :mode="mode" :label="t('backupRestoreOperator.restore.backupFilename')" />
                </div>
                <div class="col span-6">
                  <UnitInput v-model="value.spec.deleteTimeoutSeconds" :suffix="t('suffix.seconds')" :mode="mode" :label="t('backupRestoreOperator.restore.deleteTimeout')" />
                </div>
              </div>
              <div :style="{'align-items':'center'}" class="row mb-10">
                <div class="col span-6">
                  <Checkbox v-model="value.spec.prune" :mode="mode" :label="t('backupRestoreOperator.restore.prune')" />
                </div>
              </div>
            </div>
            <h3>{{ t('backupRestoreOperator.restore.titles.s3') }}</h3>
            <Banner color="info" :label="t('backupRestoreOperator.restore.credentialSecretName.tip')" />
            <div class="row mb-10">
              <div class="col span-6">
                <LabeledSelect v-model="s3.credentialSecretName" :mode="mode" :options="namespacedSecretNames" :label="t('backupRestoreOperator.restore.credentialSecretName.label')" />
              </div>
              <div class="col span-6">
                <LabeledInput v-model="s3.bucketName" :mode="mode" :label="t('backupRestoreOperator.restore.bucketName')" />
              </div>
            </div>
            <div class="row mb-10">
              <div class="col span-6">
                <LabeledInput v-model="s3.region" :mode="mode" :label="t('backupRestoreOperator.restore.region')" />
              </div>
              <div class="col span-6">
                <LabeledInput v-model="s3.folder" :mode="mode" :label="t('backupRestoreOperator.restore.folder')" />
              </div>
            </div>
            <div class="row mb-10">
              <div class="col span-6">
                <LabeledInput v-model="s3.endpoint" :mode="mode" :label="t('backupRestoreOperator.restore.endpoint')" />
                <Checkbox v-model="s3.insecureTLSSkipVerify" :mode="mode" :label="t('backupRestoreOperator.restore.insecureTLSSkipVerify')" />
              </div>
              <div class="col span-6">
                <LabeledInput v-model="s3.endpointCA" :mode="mode" type="multiline" :label="t('backupRestoreOperator.restore.endpointCA')" />
                <FileSelector v-if="mode!=='view'" class="btn btn-sm role-primary mt-5" :mode="mode" :label="t('generic.readFromFile')" @selected="e=>$set(s3, 'endpointCA', e)" />
              </div>
            </div>
            <div class="row">
              <div class="col span-6">
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
