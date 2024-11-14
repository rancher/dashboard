<script>
import CruResource from '@shell/components/CruResource';
import createEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import UnitInput from '@shell/components/form/UnitInput';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Loading from '@shell/components/Loading';
import { RadioGroup } from '@components/Form/Radio';
import S3 from '@shell/chart/rancher-backup/S3';
import { mapGetters } from 'vuex';
import { SECRET, BACKUP_RESTORE, CATALOG } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { get } from '@shell/utils/object';
import { _CREATE } from '@shell/config/query-params';
import { formatEncryptionSecretNames } from '@shell/utils/formatter';
import { FilterArgs, PaginationParamFilter } from '@shell/types/store/pagination.types';
import { SECRET_TYPES } from '@shell/config/secret';

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
    const hash = await allHash({
      catalog:     this.$store.dispatch('catalog/load'),
      resourceSet: this.$store.dispatch('cluster/find', { type: BACKUP_RESTORE.RESOURCE_SET, id: this.value?.spec?.resourceSetName || 'rancher-resource-set' }),
      apps:        this.$store.dispatch('cluster/findAll', { type: CATALOG.APP })
    });

    this.apps = hash.apps;
    this.resourceSet = hash.resourceSet;

    const BRORelease = this.apps.filter((release) => get(release, 'spec.name') === 'rancher-backup')[0];

    this.chartNamespace = BRORelease?.spec.namespace || '';

    if (this.$store.getters[`cluster/paginationEnabled`](SECRET)) {
      const findPageArgs = { // Of type ActionFindPageArgs
        namespaced: this.chartNamespace,
        pagination: new FilterArgs({
          filters: PaginationParamFilter.createSingleField({
            field: 'metadata.fields.1',
            value: SECRET_TYPES.OPAQUE
          })
        }),
      };

      const url = this.$store.getters[`cluster/urlFor`](SECRET, null, findPageArgs);
      const res = await this.$store.dispatch(`cluster/request`, { url });

      this.secrets = res?.data || [];
    } else {
      this.secrets = await this.$store.dispatch('cluster/findAll', { type: SECRET });
    }
  },

  data() {
    if (!this.value.spec) {
      this.value['spec'] = { prune: true, deleteTimeoutSeconds: 10 };
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
      secrets:        [],
      allBackups:     [],
      s3,
      targetBackup:   null,
      storageSource,
      apps:           [],
      chartNamespace: null,
    };
  },

  computed: {
    isClone() {
      return this.mode === _CREATE && !!this.liveValue.id;
    },

    availableBackups() {
      return this.allBackups.filter((backup) => backup.state !== 'error');
    },

    encryptionSecretNames() {
      return formatEncryptionSecretNames(this.secrets, this.chartNamespace);
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
        this.value.spec['storageLocation'] = { s3: {} };
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
      this.value['spec'] = { ...this.value.spec, ...out };

      this.targetBackup = neu;
    }
  }

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <CruResource
    v-else
    :validation-passed="validationPassed"
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    @finish="save"
  >
    <div>
      <div class="row mb-10">
        <div class="col span-12">
          <RadioGroup
            v-model:value="storageSource"
            name="storageSource"
            :label="t('backupRestoreOperator.s3.titles.backupLocation')"
            :options="radioOptions.options"
            :labels="radioOptions.labels"
            :mode="mode"
          />
        </div>
      </div>
      <template v-if="storageSource === 'configureS3'">
        <S3
          v-model:value="s3"
          :mode="mode"
        />
      </template>
      <div
        v-else-if="storageSource==='useBackup'"
        class="row mb-10"
      >
        <div class="col span-6">
          <LabeledSelect
            :disabled="!availableBackups.length"
            :value="targetBackup"
            :options="availableBackups"
            :mode="mode"
            option-label="metadata.name"
            :label="t('backupRestoreOperator.targetBackup')"
            @update:value="updateTargetBackup"
          />
        </div>
      </div>
    </div>
    <div class="spacer" />

    <div>
      <div
        :style="{'align-items':'center'}"
        class="row mb-10"
      >
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.backupFilename"
            :spellcheck="false"
            required
            :mode="mode"
            :label="t('backupRestoreOperator.backupFilename')"
          />
        </div>
        <div class="col span-6">
          <LabeledSelect
            v-if="isEncrypted"
            v-model:value="value.spec.encryptionConfigSecretName"
            :status="mode === 'view' ? null : 'warning'"
            :tooltip="mode === 'view' ? null : t('backupRestoreOperator.encryptionConfigName.restoretip')"
            :hover-tooltip="true"
            :mode="mode"
            :options="encryptionSecretNames"
            :label="t('backupRestoreOperator.encryptionConfigName.label')"
          />
        </div>
      </div>
      <div
        :style="{'align-items':'center'}"
        class="row"
      >
        <div class="col span-6">
          <Checkbox
            v-model:value="value.spec.prune"
            class="mb-5"
            :label="t('backupRestoreOperator.prune.label')"
            :mode="mode"
          >
            <template #label>
              <span
                v-clean-tooltip="t('backupRestoreOperator.prune.tip')"
                class="text-label"
              >
                {{ t('backupRestoreOperator.prune.label') }} <i class="icon icon-info" />
              </span>
            </template>
          </Checkbox>
          <UnitInput
            v-if="value.spec.prune"
            v-model:value="value.spec.deleteTimeoutSeconds"
            :suffix="t('suffix.seconds', {count: value.spec.deleteTimeoutSeconds})"
            :mode="mode"
            :label="t('backupRestoreOperator.deleteTimeout.label')"
          >
            <template #label>
              <label
                v-clean-tooltip="t('backupRestoreOperator.deleteTimeout.tip')"
                class="v-popper--has-tooltip"
              >
                {{ t('backupRestoreOperator.deleteTimeout.label') }} <i class="icon icon-info" />
              </label>
            </template>
          </UnitInput>
        </div>
      </div>
    </div>
  </CruResource>
</template>
