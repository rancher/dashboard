<script>
import flattenDeep from 'lodash/flattenDeep';
import { sortBy } from '@shell/utils/sort';

import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ResourceTable from '@shell/components/ResourceTable';

export default {
  components: {
    Banner, LabeledSelect, Loading, ResourceTable
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

    if ( this.rows ) {
      const flatRules = this.rows.flatMap((row) => {
        return flattenDeep(row.spec.rules);
      });

      const resources = flatRules.flatMap(r => r.resources);
      const operations = flatRules.flatMap(r => r.operations);

      if ( resources ) {
        this.resources = [...new Set(resources)];
      }

      if ( operations ) {
        this.operations = [...new Set(operations)];
      }
    }
  },

  data() {
    return {
      rows:              null,
      resources:         null,
      operations:        null,
      filteredResource:  null,
      filteredOperation: null
    };
  },

  computed: {
    headers() {
      return this.$store.getters['type-map/headersFor'](this.schema);
    },

    filteredRows() {
      const rows = ( this.rows || [] );

      const out = rows.filter((row) => {
        const flatRules = flattenDeep(row.spec.rules);
        const flatResources = flatRules.flatMap(r => r.resources);
        const flatOperations = flatRules.flatMap(r => r.operations);

        if ( this.filteredResource && !flatResources.includes(this.filteredResource) ) {
          return false;
        }

        if ( this.filteredOperation && !flatOperations.includes(this.filteredOperation) ) {
          return false;
        }

        return true;
      });

      return sortBy(out, 'id');
    }
  },

  methods: {
    filterSelection(neu) {
      const out = [];

      this.rows.map((row) => {
        let { option, select } = neu;
        const { filteredResource, filteredOperation, filteredRows } = this;

        // when user selects `All` for operations, use this.filteredResource to match rows instead
        if ( option === 'operations' && select === '' ) {
          option = 'resources';
          select = filteredResource;
        }

        const rules = row.spec.rules;
        const options = rules.find(rule => rule[option]);

        const resourceType = filteredResource ? options['resources'].find(opt => opt === filteredResource) : 'All';
        const actionTypes = filteredOperation ? options['operations'].find(opt => opt === filteredOperation) : 'All';

        const selectedOption = options[option].find(opt => opt === select);
        const filteredOption = filteredRows?.find(obj => obj === row);

        if ( resourceType && actionTypes && selectedOption && !filteredOption ) {
          out.push(row);
        }

        if ( !selectedOption && filteredOption ) {
          const index = out.indexOf(row);

          out.slice(index);
        }
      });

      this.$set(this, 'filteredRows', out);
    },

    hasNamespaceSelector(row) {
      return row.namespaceSelector;
    },

    resetFilter() {
      this.$set(this, 'filteredResource', null);
      this.$set(this, 'filteredOperation', null);
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
      <div class="col span-3">
        <LabeledSelect
          v-model="filteredResource"
          :options="resources"
          label="Resources"
          style="min-width: 200px;"
        >
          <template #option="opt">
            {{ opt.label }}
          </template>
        </LabeledSelect>
      </div>

      <div class="col span-3">
        <LabeledSelect
          v-model="filteredOperation"
          :options="operations"
          label="Operations"
          style="min-width: 200px;"
        >
          <template #option="opt">
            {{ opt.label }}
          </template>
        </LabeledSelect>
      </div>

      <button
        ref="btn"
        class="btn, btn-sm, role-primary"
        type="button"
        @click="resetFilter"
      >
        {{ t('kubewarden.utils.resetFilter') }}
      </button>
    </div>

    <ResourceTable :schema="schema" :rows="filteredRows" :headers="headers">
      <template #col:mode="{ row }">
        <td>
          <span class="policy__mode">
            <span class="text-capitalize">{{ row.spec.mode }}</span>
            <i
              v-if="!hasNamespaceSelector(row)"
              v-tooltip.bottom="t('kubewarden.admissionPolicy.namespaceWarning')"
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
