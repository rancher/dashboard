<script>
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';
import Select from '@shell/components/form/Select';

export default {
  components: {
    Banner, Loading, ResourceTable, Select
  },

  props: {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    this.rows = await this.$store.dispatch('cluster/findAll', { type: this.resource });
  },

  data() {
    const policyResources = [
      {
        label: 'All',
        value: ''
      },
      {
        label: '*',
        value: '*'
      },
      {
        label: 'Pods',
        value: 'pods'
      },
      {
        label: 'Services',
        value: 'services'
      },
      {
        label: 'Ingress',
        value: 'ingresses'
      }
    ];

    const policyActions = [
      {
        label: 'All',
        value: ''
      },
      {
        label: 'CREATE',
        value: 'CREATE'
      },
      {
        label: 'UPDATE',
        value: 'UPDATE'
      },
      {
        label: 'DELETE',
        value: 'DELETE'
      }
    ];

    return {
      rows:              null,
      filteredRows:      null,
      filteredResource:  '',
      filteredAction:    '',
      policyResources,
      policyActions,
    };
  },

  computed: {
    headers() {
      return this.$store.getters['type-map/headersFor'](this.schema);
    },

    showRows() {
      if ( this.filteredResource === '' && this.filteredAction === '' ) {
        return this.rows;
      }

      return this.filteredRows;
    }
  },

  methods: {
    filterSelection(neu) {
      const out = [];

      this.rows.map((row) => {
        let { option, select } = neu;
        const { filteredResource, filteredAction, filteredRows } = this;

        // when user selects `All` for operations, use this.filteredResource to match rows instead
        if (option === 'operations' && select === '') {
          option = 'resources';
          select = filteredResource;
        }

        const rules = row.spec.rules;
        const options = rules.find(rule => rule[option]);

        const resourceType = filteredResource ? options['resources'].find(opt => opt === filteredResource) : 'All';
        const actionTypes = filteredAction ? options['operations'].find(opt => opt === filteredAction) : 'All';

        const selectedOption = options[option].find(opt => opt === select);
        const filteredOption = filteredRows?.find(obj => obj === row);

        if (resourceType && actionTypes && selectedOption && !filteredOption) {
          out.push(row);
        }

        if (!selectedOption && filteredOption) {
          const index = out.indexOf(row);

          out.slice(index);
        }
      });

      this.$set(this, 'filteredRows', out);
    },

    hasNamespaceSelector(row) {
      return row.namespaceSelector;
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Banner
      class="type-banner mb-20 mt-0"
      color="info"
      :label="t('kubewarden.clusterAdmissionPolicy.description')"
    />

    <div class="row mb-20">
      <div class="span-3 mr-10">
        <span>Resources</span>
        <Select
          v-model="filteredResource"
          :clearable="false"
          :searchable="false"
          :options="policyResources"
          placement="bottom"
          label="label"
          style="min-width: 200px;"
          :reduce="opt => opt.value"
          @option:selected="filterSelection({ option: 'resources', select: filteredResource })"
        >
          <template #option="opt">
            {{ opt.label }}
          </template>
        </Select>
      </div>

      <div class="span-3">
        <span>Actions</span>
        <Select
          v-model="filteredAction"
          :clearable="false"
          :searchable="false"
          :options="policyActions"
          placement="bottom"
          label="label"
          style="min-width: 200px;"
          :reduce="opt => opt.value"
          @option:selected="filterSelection({ option: 'operations', select: filteredAction })"
        >
          <template #option="opt">
            {{ opt.label }}
          </template>
        </Select>
      </div>
    </div>

    <ResourceTable :schema="schema" :rows="showRows" :headers="headers">
      <template #col:mode="{ row }">
        <td>
          <span class="policy__mode">
            <span class="text-capitalize">{{ row.spec.mode }}</span>
            <i
              v-if="!hasNamespaceSelector(row)"
              :[v-tooltip.bottom]="t('kubewarden.admissionPolicy.namespaceWarning')"
              class="icon icon-warning"
            />
          </span>
        </td>
      </template>
    </ResourceTable>
  </div>
</template>

<style lang="scss" scoped>
.policy {
  &__mode {
    display: flex;
    align-items: center;

    i {
      margin-left: 5px;
      font-size: 22px;
      color: var(--warning);
    }
  }
}
</style>
