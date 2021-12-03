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
        value: 'ingress'
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
      filteredRows:      [],
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
      if (this.filteredResource === '' && this.filteredAction === '') {
        return this.rows;
      }

      return this.filteredRows;
    }
  },

  methods: {
    filterSelection(neu) {
      this.rows.map((row) => {
        let { option, select } = neu;

        // when user selects `All` for operations, use this.filteredResource to match rows instead
        if (option === 'operations' && select === '') {
          option = 'resources';
          select = this.filteredResource;
        }

        const rules = row.spec.rules;
        const options = rules.find(rule => rule[option]);

        // there are problems with using an empty string as the default resource or action, so 'All' will fix this
        const resourceType = this.filteredResource ? options['resources'].find(opt => opt === this.filteredResource) : 'All';
        const actionTypes = this.filteredAction ? options['operations'].find(opt => opt === this.filteredAction) : 'All';

        const selectedOption = options[option].find(opt => opt === select);
        const filteredOption = this.filteredRows.find(obj => obj === row); // used if row already exists in filteredRows

        if (resourceType && actionTypes && selectedOption) {
          this.$set(this, 'filteredRows', [row]);
        } else if (!selectedOption && filteredOption) {
          this.filteredRows.pop(row);
        }
      });
    },
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
          @input="opt => filterSelection({ option: 'resources', select: opt })"
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
          @input="opt => filterSelection({ option: 'operations', select: opt })"
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
