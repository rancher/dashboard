<script>
import { sortBy } from '@/utils/sort';
import { NAMESPACE } from '@/config/types';
import { DESCRIPTION } from '@/config/labels-annotations';
import { _VIEW, _EDIT } from '@/config/query-params';
import LabeledInput from '@/components/form/LabeledInput';
import InputWithSelect from '@/components/form/InputWithSelect';
import DetailTop from '@/components/DetailTop';

export default {
  components:   {
    DetailTop, LabeledInput, InputWithSelect
  },

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
    extraDetailColumns: {
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
  },

  data() {
    let metadata = this.value.metadata;

    if ( !metadata ) {
      metadata = {};
      this.value.metadata = metadata;
    }

    if ( this.namespaced && !metadata.namespace ) {
      metadata.namespace = this.$store.getters['defaultNamespace'];
    }

    const description = metadata.annotations?.[DESCRIPTION];

    return {
      namespace: metadata.namespace,
      name:      metadata.name,
      description,
    };
  },

  computed: {
    nameDisabled() {
      return this.mode === _EDIT && !this.nameEditable;
    },

    detailTopColumns() {
      const { metadata = {} } = this.value;
      const { annotations = {} } = metadata;

      return [
        metadata.namespace
          ? {
            title:   'Namespace',
            content: metadata.namespace
          } : null,
        metadata.name
          ? {
            title:   'Name',
            content: metadata.name
          } : null,
        annotations[DESCRIPTION]
          ? {
            title:   'Description',
            content: annotations[DESCRIPTION]
          } : null,
        ...this.extraDetailColumns
      ].filter(c => c);
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

    notView() {
      return this.mode !== _VIEW;
    },

    colSpan() {
      const cols = 2 + this.extraColumns.length;
      const span = 12 / cols;

      return `span-${ span }`;
    },
  },

  watch: {
    name(val) {
      this.value.metadata.name = val;
    },

    namespace(val) {
      this.value.metadata.namespace = val;
    },

    description(val) {
      this.value.setAnnotation(DESCRIPTION, val);
    },
  },

  mounted() {
    this.$nextTick(() => {
      this.$refs.name.focus();
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
    <div v-if="notView" class="row">
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
            select-value="default"
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
            :mode="nameMode"
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
    <DetailTop v-else :columns="detailTopColumns" />
  </div>
</template>
