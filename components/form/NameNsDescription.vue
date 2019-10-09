<script>
import { NAMESPACE, ANNOTATION } from '~/config/types';
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

    description: {
      get() {
        if ( this.value && this.value.metadata && this.value.metadata.annotations ) {
          return this.value.metadata.annotations[ANNOTATION.DESCRIPTION];
        }

        return '';
      },

      set(neu) {
        if ( !this.value ) {
          return;
        }

        if ( !this.value.metadata ) {
          this.value.metadata = {};
        }

        if ( !this.value.metadata.annotations ) {
          this.value.metadata.annotations = {};
        }

        this.value.metadata.annotations[ANNOTATION.DESCRIPTION] = neu;
      }
    },

    onlyForCreate() {
      if ( this.mode === _CREATE ) {
        return _CREATE;
      }

      return _VIEW;
    },

    notView() {
      return this.mode !== _VIEW;
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
    <div v-if="notView || description" class="row">
      <div class="col span-12">
        <LabeledInput
          v-model="description"
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
