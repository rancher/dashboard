<script>
import { get, set } from '@/utils/object';
import { sortBy } from '@/utils/sort';
import { NAMESPACE } from '@/config/types';
import { DESCRIPTION } from '@/config/labels-annotations';
import { _VIEW, _EDIT } from '@/config/query-params';
import LabeledInput from '@/components/form/LabeledInput';
import InputWithSelect from '@/components/form/InputWithSelect';

export default {
  components: { LabeledInput, InputWithSelect },

  props: {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    },
    namespaced: {
      type:    Boolean,
      default: true,
    },
    extraColumns: {
      type:    Array,
      default: () => []
    },
    nameEditable: {
      type:    Boolean,
      default: false,
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

    // Use specific fields on the value instead of the normal metadata locations
    nameKey: {
      type:    String,
      default: null,
    },
    namespaceKey: {
      type:    String,
      default: null,
    },
    descriptionKey: {
      type:    String,
      default: null,
    },
  },

  data() {
    const v = this.value;
    const metadata = v.metadata;
    let namespace, name, description;

    if (this.nameKey ) {
      name = get(v, this.nameKey);
    } else {
      name = metadata.name;
    }

    if ( this.namespaced ) {
      if ( this.namespaceKey ) {
        namespace = get(v, this.namespaceKey);
      } else {
        namespace = metadata?.namespace;
      }

      if ( !namespace ) {
        namespace = this.$store.getters['defaultNamespace'];
      }
    }

    if ( this.descriptionKey ) {
      description = get(v, this.descriptionKey);
    } else {
      description = metadata?.annotations?.[DESCRIPTION];
    }

    return {
      namespace,
      name,
      description
    };
  },

  computed: {
    nameDisabled() {
      return this.mode === _EDIT && !this.nameEditable;
    },

    namespaces() {
      const choices = this.$store.getters['cluster/all'](NAMESPACE);

      const out = sortBy(choices.map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      }), 'label');

      return out;
    },

    isView() {
      return this.mode === _VIEW;
    },

    colSpan() {
      const cols = 2 + this.extraColumns.length;
      const span = 12 / cols;

      return `span-${ span }`;
    },
  },

  watch: {
    name(val) {
      if ( this.nameKey ) {
        set(this.value, this.nameKey, val);
      } else {
        this.value.metadata.name = val;
      }
    },

    namespace(val) {
      if ( this.namespaceKey ) {
        set(this.value, this.namespaceKey, val);
      } else {
        this.value.metadata.namespace = val;
      }
    },

    description(val) {
      if ( this.descriptionKey ) {
        set(this.value, this.descriptionKey, val);
      } else {
        this.value.setAnnotation(DESCRIPTION, val);
      }
    },
  },

  mounted() {
    this.$nextTick(() => {
      if (this.$refs.name) {
        this.$refs.name.focus();
      }
    });
  },

  methods: {
    changeNameAndNamespace(e) {
      this.name = (e.text || '').toLowerCase();
      this.namespace = e.selected;
    }
  }
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div :class="{col: true, [colSpan]: true}">
        <slot name="namespace">
          <InputWithSelect
            v-if="namespaced"
            ref="name"
            :options="namespaces"
            text-label="Name"
            select-label="Namespace"
            :text-value="name"
            :text-required="true"
            :select-value="namespace"
            :mode="mode"
            :disabled="nameDisabled"
            @input="changeNameAndNamespace($event)"
          />
          <LabeledInput
            v-else
            ref="name"
            key="name"
            v-model="name"
            label="Name"
            :disabled="nameDisabled"
            :mode="mode"
            :min-height="30"
          />
        </slot>
      </div>
      <div :class="{col: true, [colSpan]: true}">
        <LabeledInput
          key="description"
          v-model="description"
          label="Description"
          :mode="mode"
          :placeholder="descriptionPlaceholder"
          :min-height="30"
        />
      </div>
      <div v-for="slot in extraColumns" :key="slot" :class="{col: true, [colSpan]: true}">
        <slot :name="slot">
        </slot>
      </div>
    </div>
  </div>
</template>
