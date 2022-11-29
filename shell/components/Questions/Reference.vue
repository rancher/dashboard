<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { filterBy } from '@shell/utils/array';
import { PVC, STORAGE_CLASS } from '@shell/config/types';
import Question from './Question';

// Older versions of rancher document these words as valid types
const LEGACY_MAP = {
  storageclass: STORAGE_CLASS,
  pvc:          PVC,
};

export default {
  components: { LabeledInput, LabeledSelect },
  mixins:     [Question],

  props: {
    inStore: {
      type:    String,
      default: 'cluster',
    },

    targetNamespace: {
      type:    String,
      default: null,
    },
  },

  async fetch() {
    if ( this.typeSchema ) {
      this.all = await this.$store.dispatch(`${ this.inStore }/findAll`, { type: this.typeName });
    }
  },

  data() {
    const t = this.question.type;

    let typeName;

    const match = t.match(/^reference\[(.*)\]$/);

    if ( match ) {
      typeName = match?.[1];
    } else {
      typeName = LEGACY_MAP[t] || t;
    }

    let typeSchema;

    if ( typeName ) {
      typeSchema = this.$store.getters[`${ this.inStore }/schemaFor`](typeName);
    }

    return {
      typeName,
      typeSchema,
      all: [],
    };
  },

  computed: {
    isNamespaced() {
      return !!this.typeSchema?.attributes?.namespaced;
    },

    options() {
      let out = this.all;

      if ( this.isNamespaced ) {
        out = filterBy(this.all, 'metadata.namespace', this.targetNamespace);
      }

      return out.map((x) => {
        return {
          label: x.nameDisplay || x.metadata.name,
          value: x.metadata.name
        };
      });
    }
  },
};
</script>

<template>
  <div
    v-if="typeSchema"
    class="row"
  >
    <div class="col span-6">
      <LabeledSelect
        :mode="mode"
        :options="options"
        :disabled="$fetchState.pending || disabled"
        :label="displayLabel"
        :placeholder="question.description"
        :required="question.required"
        :value="value"
        @input="!$fetchState.pending && $emit('input', $event)"
      />
    </div>
    <div class="col span-6 mt-10">
      {{ typeSchema.attributes.kind }}<span v-if="isNamespaced"> in namespace {{ targetNamespace }}</span>
      <div v-if="showDescription">
        {{ question.description }}
      </div>
    </div>
  </div>
  <div
    v-else
    class="row"
  >
    <div class="col span-6">
      <LabeledInput
        :mode="mode"
        :disabled="$fetchState.pending || disabled"
        :label="displayLabel"
        :placeholder="question.description"
        :required="question.required"
        :value="value"
        @input="!$fetchState.pending && $emit('input', $event)"
      />
    </div>
    <div class="col span-6 mt-10">
      {{ question.type }}<span v-if="isNamespaced"> in namespace {{ targetNamespace }}</span>
      <div v-if="showDescription">
        {{ question.description }}
      </div>
      <div class="text-error">
        (You do not have access to list this type)
      </div>
    </div>
  </div>
</template>
