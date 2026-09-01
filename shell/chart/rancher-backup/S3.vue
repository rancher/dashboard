<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import FileSelector from '@shell/components/form/FileSelector';
import ResourceLabeledSelect from '@shell/components/form/ResourceLabeledSelect';
import { mapGetters } from 'vuex';
import { SECRET } from '@shell/config/types';

export default {
  emits: ['valid'],

  components: {
    LabeledInput,
    Checkbox,
    FileSelector,
    ResourceLabeledSelect,
  },

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
    },

  },

  data() {
    return { SECRET };
  },

  mounted() {
    this.$emit('valid', this.valid);
  },

  beforeUnmount() {
    this.$emit('valid', true);
  },

  watch: {
    valid() {
      this.$emit('valid', this.valid);
    }
  },

  computed: {
    credentialSecret: {
      get() {
        const { credentialSecretName, credentialSecretNamespace } = this.value;

        return { metadata: { name: credentialSecretName, namespace: credentialSecretNamespace } };
      },

      set(neu) {
        const { name, namespace } = neu.metadata;

        this.value['credentialSecretName'] = name;
        this.value['credentialSecretNamespace'] = namespace;
      }
    },
    valid() {
      return !!this.value.endpoint && !!this.value.bucketName;
    },
    ...mapGetters({ t: 'i18n/t' })
  },

  methods: {
    setCA(ca) {
      try {
        const encoded = btoa(ca);

        this.value['endpointCA'] = encoded;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
      }
    },
  },

  created() {
    const { credentialSecretName, credentialSecretNamespace } = this.value;

    if (credentialSecretName && !credentialSecretNamespace) {
      this.value.credentialSecretName = '';
    }
  },
};
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <ResourceLabeledSelect
          v-model:value="credentialSecret"
          :get-option-label="opt=>opt.metadata.name || ''"
          option-key="id"
          :mode="mode"
          :label="t('backupRestoreOperator.s3.credentialSecretName')"
          :resource-type="SECRET"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.bucketName"
          data-testid="S3-bucketName"
          :mode="mode"
          :label="t('backupRestoreOperator.s3.bucketName')"
          required
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.region"
          :mode="mode"
          :label="t('backupRestoreOperator.s3.region')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.folder"
          :mode="mode"
          :label="t('backupRestoreOperator.s3.folder')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.endpoint"
          :mode="mode"
          :label="t('backupRestoreOperator.s3.endpoint')"
          data-testid="S3-endpoint"
          required
        />
        <Checkbox
          v-model:value="value.insecureTLSSkipVerify"
          class="mt-10"
          :mode="mode"
          :label="t('backupRestoreOperator.s3.insecureTLSSkipVerify')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.endpointCA"
          :mode="mode"
          type="multiline"
          :label="t('backupRestoreOperator.s3.endpointCA.label')"
        />
        <div class="ca-controls">
          <FileSelector
            v-if="mode!=='view'"
            class="btn btn-sm role-primary mt-5"
            :mode="mode"
            :label="t('generic.readFromFile')"
            @selected="e=> setCA(e)"
          />
          <div class="ca-tooltip">
            <i
              v-clean-tooltip="t('backupRestoreOperator.s3.endpointCA.prompt')"
              class="icon icon-info"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
  .ca-controls {
    display: flex;

    .ca-tooltip {
      flex: 1;
      margin-top: 4px;
      text-align: right;

      > i {
        font-size: 16px;
      };
    }
  }
</style>
