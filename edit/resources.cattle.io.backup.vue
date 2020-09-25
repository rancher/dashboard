<script>
import CruResource from '@/components/CruResource';
import createEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/form/LabeledInput';
import UnitInput from '@/components/form/UnitInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import Banner from '@/components/Banner';
import RadioGroup from '@/components/form/RadioGroup';
import NameNsDescription from '@/components/form/NameNsDescription';
import Loading from '@/components/Loading';
import S3 from '@/chart/backup-restore-operator/S3';

import { mapGetters } from 'vuex';
import { SECRET, BACKUP_RESTORE, CATALOG } from '@/config/types';
import { allHash } from '@/utils/promise';
import { NAMESPACE } from '@/config/query-params';
import { sortBy } from '@/utils/sort';
import { get } from '@/utils/object';
export default {

  components: {
    CruResource,
    UnitInput,
    LabeledInput,
    LabeledSelect,
    RadioGroup,
    NameNsDescription,
    Banner,
    Loading,
    S3
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
      secrets:      this.$store.dispatch('cluster/findAll', { type: SECRET }),
      resourceSets: this.$store.dispatch('cluster/findAll', { type: BACKUP_RESTORE.RESOURCE_SET }),
      apps:         this.$store.dispatch('cluster/findAll', { type: CATALOG.APP })

    });

    this.allSecrets = hash.secrets;
    this.allResourceSets = hash.resourceSets;
    this.apps = hash.apps;
  },

  data() {
    if (!this.value.spec) {
      this.$set(this.value, 'spec', { retentionCount: 10 });
    }

    const s3 = {};

    return {
      allSecrets: [], allResourceSets: [], s3, storageSource: 'useDefault', useEncryption: false, apps: [], setSchedule: false,
    };
  },

  computed: {
    chartNamespace() {
      const BRORelease = this.apps.filter(release => get(release, 'spec.name') === 'backup-restore-operator')[0];

      return BRORelease ? BRORelease.spec.namespace : '';
    },

    encryptionSecretNames() {
      return this.allSecrets.filter(secret => !!secret.data['encryption-provider-config.yaml'] && secret.metadata.namespace === this.chartNamespace).map(secret => secret.metadata.name);
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

  watch: {
    storageSource(neu) {
      if (neu === 'useDefault') {
        delete this.value.spec.storageLocation;
      } else {
        this.$set(this.value.spec, 'storageLocation', { s3: this.s3 });
      }
    },

    namespacedResourceSetNames(neu) {
      if (neu.length === 1) {
        this.$set(this.value.spec, 'resourceSetName', neu[0]);
      }
    },

    setSchedule(neu) {
      if (!neu) {
        delete this.value.spec.schedule;
        delete this.value.spec.retentionCount;
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <CruResource :validation-passed="!!value.spec.resourceSetName && !!value.spec.resourceSetName.length" :done-route="doneRoute" :resource="value" :mode="mode" @finish="save">
      <template>
        <NameNsDescription :mode="mode" :value="value" :namespaced="false" />
        <template v-if="resourceSetAvailable">
          <div class="bordered-section">
            <div class="row mb-10">
              <div class="col span-6">
                <LabeledSelect v-model="value.spec.resourceSetName" required :mode="mode" :options="namespacedResourceSetNames" :label="t('backupRestoreOperator.resourceSetName')" />
              </div>
            </div>
          </div>
          <div class="bordered-section">
            <RadioGroup
              v-model="setSchedule"
              :mode="mode"
              :label="t('backupRestoreOperator.schedule.label')"
              name="setSchedule"
              :options="[false, true]"
              :labels="[t('backupRestoreOperator.schedule.options.disabled'), t('backupRestoreOperator.schedule.options.enabled')]"
            />
            <div v-if="setSchedule" class="row mt-10 mb-10">
              <div class="col span-6">
                <LabeledInput v-model="value.spec.schedule" :mode="mode" :label="t('backupRestoreOperator.schedule.label')" :placeholder="t('backupRestoreOperator.schedule.placeholder')" />
              </div>
              <div class="col span-6">
                <UnitInput v-model="value.spec.retentionCount" :suffix="t('backupRestoreOperator.retentionCount.units', {count: value.spec.retentionCount || 0})" :mode="mode" :label="t('backupRestoreOperator.retentionCount.label')" />
              </div>
            </div>
          </div>

          <div class="bordered-section">
            <div class="row">
              <div class="col span-12">
                <RadioGroup
                  v-model="useEncryption"
                  name="useEncryption"
                  :label="t('backupRestoreOperator.encryption')"
                  :options="encryptionOptions.options"
                  :labels="encryptionOptions.labels"
                  :mode="mode"
                />
              </div>
            </div>
            <div v-if="useEncryption" class="row mt-10">
              <div class="col span-6">
                <LabeledSelect
                  v-model="value.spec.encryptionConfigSecretName"
                  :tooltip="t('backupRestoreOperator.encryptionConfigName.backuptip')"
                  :hover-tooltip="true"
                  :mode="mode"
                  :options="encryptionSecretNames"
                  :label="t('backupRestoreOperator.encryptionConfigName.label')"
                />
              </div>
            </div>
          </div>

          <div class="row mb-10">
            <div class="col span-12">
              <RadioGroup
                v-model="storageSource"
                name="storageSource"
                :label="t('backupRestoreOperator.s3.titles.backupLocation')"
                :options="storageOptions.options"
                :labels="storageOptions.labels"
                :mode="mode"
              />
            </div>
          </div>

          <template v-if="storageSource !== 'useDefault'">
            <S3 :value="s3" :secrets="allSecrets" :mode="mode" />
          </template>
        </template>
        <Banner v-else color="error">
          <span v-html="t('backupRestoreOperator.noResourceSet')" />
        </Banner>
      </template>
    </CruResource>
  </div>
</template>
