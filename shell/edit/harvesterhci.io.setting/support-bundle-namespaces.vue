<script>
import { NAMESPACE } from '@shell/config/types';
import CreateEditView from '@shell/mixins/create-edit-view';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  name: 'HarvesterBundleNamespaces',

  components: { LabeledSelect },

  mixins: [CreateEditView],

  async fetch() {
    await this.$store.dispatch('harvester/findAll', { type: NAMESPACE });
  },

  data() {
    let namespaces = [];
    const namespacesStr = this.value?.value || this.value?.default || '';

    if (namespacesStr) {
      namespaces = namespacesStr.split(',');
    }

    return { namespaces };
  },

  computed: {
    namespaceOptions() {
      return this.$store.getters['harvester/all'](NAMESPACE).map((N) => {
        return {
          label: N.id,
          value: N.id
        };
      });
    }
  },

  methods: {
    update() {
      const namespaceStr = this.namespaces.join(',');

      this.$set(this.value, 'value', namespaceStr);
    }
  },

  watch: {
    'value.value': {
      handler(neu) {
        if (neu === this.value.default || !neu) {
          this.namespaces = [];
        }
      },
      deep: true
    }
  }
};
</script>

<template>
  <div class="row">
    <div class="col span-12">
      <LabeledSelect
        v-model="namespaces"
        :multiple="true"
        label-key="nameNsDescription.namespace.label"
        :mode="mode"
        :options="namespaceOptions"
        @input="update"
      />
    </div>
  </div>
</template>
