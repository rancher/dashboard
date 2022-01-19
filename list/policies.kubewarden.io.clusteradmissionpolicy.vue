<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import Select from '@/components/form/Select';

export default {
  components: {
    Loading, ResourceTable, Select
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

    // This needs to be fixed... currently if a resource/action is selected that has only 1 row and
    // then another resource/action is selected that *also* has 1 row: showRows and this.filteredRows
    // update correctly, but ResourceTable will not update. It reuses whatever computed value is in the cache.
    //
    // e.g. select `Services` as a resource, then select `Ingress`.
    //  - this.filteredRows is updated but ResourceTable's rows do not update.
    showRows() {
      if (this.filteredResource === '' && this.filteredAction === '') {
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
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
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

    <ResourceTable :schema="schema" :rows="showRows" :headers="headers" />
  </div>
</template>
