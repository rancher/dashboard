<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import FileSelector from '@shell/components/form/FileSelector';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { mapGetters } from 'vuex';
import { SECRET } from '@shell/config/types';
import { PaginationParamFilter } from '~/shell/types/store/pagination.types';

export default {
  components: {
    LabeledInput,
    Checkbox,
    FileSelector,
    LabeledSelect,
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

    secrets: {
      type:    Array,
      default: () => []
    }
  },

  mounted() {
    this.$emit('valid', this.valid);
  },

  beforeDestroy() {
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

        this.$set(this.value, 'credentialSecretName', name);
        this.$set(this.value, 'credentialSecretNamespace', namespace);
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

        this.$set(this.value, 'endpointCA', encoded);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
      }
    },

    /**
     * Given inputs make a paginated request and return the result
     */
    async paginateSecrets({
      pageContent,
      page,
      filter,
      pageSize,
      resetPage
    }) {
      try {
        // Construct params for request
        const filters = !!filter ? [PaginationParamFilter.createSingleField({ field: 'metadata.name', value: filter })] : [];

        // Of type {@link ActionFindPageArgs}
        const opt = {
          pagination: {
            page,
            pageSize,
            sort: [{ asc: true, field: 'metadata.namespace' }, { asc: true, field: 'metadata.name' }],
            filters
          },
        };
        const url = this.$store.getters['cluster/urlFor'](SECRET, null, opt);

        // Make request (note we're not bothering to persist anything to the store, response is transient)
        const res = await this.$store.dispatch('cluster/request', { url });
        const options = resetPage ? res.data : pageContent.concat(res.data);

        // Create the new option collection by...
        const namespaced = {};

        // ... grouping by namespace
        options.forEach((secret) => {
          const ns = secret.metadata.namespace;

          if (secret.kind === 'group') { // this could contain a previous option set which contains groups
            return;
          }
          if (!namespaced[ns]) {
            namespaced[ns] = [];
          }
          namespaced[ns].push(secret);
        });

        let grouped = [];

        // ... then sort groups by name and combined into a single array
        Object.keys(namespaced).sort().forEach((ns) => {
          grouped.push({
            kind:     'group',
            icon:     'icon-namespace',
            id:       ns,
            metadata: { name: ns },
            disabled: true,
          });
          grouped = grouped.concat(namespaced[ns]);
        });

        return {
          page:  grouped,
          pages: res.pages,
          total: res.count
        };
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
      }

      return { page: [] };
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
        <LabeledSelect
          v-model="credentialSecret"
          :get-option-label="opt=>opt.metadata.name || ''"
          option-key="id"
          :mode="mode"
          :paginate="paginateSecrets"
          :searchable="true"
          :filterable="false"
          :label="t('backupRestoreOperator.s3.credentialSecretName')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.bucketName"
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
          v-model="value.region"
          :mode="mode"
          :label="t('backupRestoreOperator.s3.region')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.folder"
          :mode="mode"
          :label="t('backupRestoreOperator.s3.folder')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model="value.endpoint"
          :mode="mode"
          :label="t('backupRestoreOperator.s3.endpoint')"
          data-testid="S3-endpoint"
          required
        />
        <Checkbox
          v-model="value.insecureTLSSkipVerify"
          class="mt-10"
          :mode="mode"
          :label="t('backupRestoreOperator.s3.insecureTLSSkipVerify')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.endpointCA"
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
