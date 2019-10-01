<script>
import { NAMESPACE } from '~/config/types';
import { _CREATE, _VIEW } from '~/config/query-params';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';

export default {
  components:   { LabeledInput, LabeledSelect },

  props: {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    },
    nameLabel: {
      type:    String,
      default: 'Name'
    },
    namePlaceholder: {
      type:    String,
      default: ''
    },
    descriptionPlaceholder: {
      type:    String,
      default: 'Any text you want that better describes this resource'
    },
  },

  data() {
    const value = this.value;

    if ( !value.metadata) {
      value.metadata = {};
    }

    if ( !value.metadata.annotations ) {
      value.metadata.annotations = {};
    }

    return {};
  },

  computed: {
    namespaces() {
      const choices = this.$store.getters['cluster/all'](NAMESPACE);

      return choices.map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      });
    },

    onlyForCreate() {
      if ( this.mode === _CREATE ) {
        return _CREATE;
      }

      return _VIEW;
    }
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model="value.metadata.name"
          :mode="onlyForCreate"
          :label="nameLabel"
          :placeholder="namePlaceholder"
          :required="true"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="value.metadata.namespace"
          :mode="onlyForCreate"
          :options="namespaces"
          :required="true"
          label="Namespace"
          placeholder="Select a namespace"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-12">
        <LabeledInput
          v-model="value.metadata.annotations['rio.io/description']"
          type="multiline"
          label="Description"
          :mode="mode"
          :placeholder="descriptionPlaceholder"
        />
      </div>
    </div>

    <hr />
  </div>
</template>
