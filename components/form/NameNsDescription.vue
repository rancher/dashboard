<script>
import { sortBy } from '@/utils/sort';
import { get } from '@/utils/object';
import { escapeRegex } from '@/utils/string';
import { NAMESPACE } from '@/config/types';
import { DESCRIPTION } from '@/config/labels-annotations';
import { _CREATE, _VIEW } from '@/config/query-params';
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

    useGeneratedName: {
      type:    Boolean,
      default: false,
    },
    generatedSuffix: {
      type:    String,
      default: '-'
    }
  },

  data() {
    let metadata = this.value.metadata;

    if ( !metadata ) {
      metadata = {};
      this.value.metadata = metadata;
    }

    if ( !metadata.annotations ) {
      metadata.annotations = { [DESCRIPTION]: '' };
    }

    if ( this.namespaced && !metadata.namespace ) {
      metadata.namespace = this.$store.getters['defaultNamespace'];
    }

    let name;

    if ( this.useGeneratedName ) {
      name = metadata.generateName || '';
      const re = new RegExp(`${ escapeRegex(this.generatedSuffix) }$`, 'i');

      name = name.replace(re, '');
    } else {
      name = metadata.name || '';
    }

    return {
      name,
      ANNOTATION_DESCRIPTION: DESCRIPTION,
      createNS:               false,
      toCreate:               '',
      addDescription:         false
    };
  },

  computed: {
    namespaces() {
      const choices = this.$store.getters['cluster/all'](NAMESPACE);

      return sortBy(choices.map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      }), 'label');
    },

    onlyForCreate() {
      if ( this.mode === _CREATE ) {
        return _CREATE;
      }

      return _VIEW;
    },

    notView() {
      return this.mode !== _VIEW;
    },

    colSpan() {
      const cols = 2 + this.extraColumns.length;
      const span = 12 / cols;

      return `span-${ span }`;
    },
    description() {
      return get(this.value, `metadata.annotations[${ DESCRIPTION }]`);
    },
    wantDescription() {
      return !!this.description || this.addDescription;
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
    }
  },

  watch: {
    name(neu) {
      if ( this.useGeneratedName ) {
        this.value.metadata.generateName = neu + this.generatedSuffix;
        delete this.value.metadata.name;
      } else {
        this.value.metadata.name = neu;
      }
    },
  },

  mounted() {
    const valueRef = get(this.$refs, 'nameNS.$refs.text.$refs.value');

    if (valueRef) {
      valueRef.focus();
    }
  },

  methods: {
    changeNameNS(e) {
      this.name = e.text;
      this.value.metadata.namespace = e.selected;
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
            ref="nameNS"
            :options="namespaces"
            text-label="Name"
            select-label="Namespace"
            :text-value="name"
            :text-required="true"
            select-value="default"
            :mode="mode"
            @input="changeNameNS"
          />
          <LabeledInput
            v-else
            key="name"
            v-model="name"
            label="Name"
            :mode="mode"
            :min-height="30"
            :hide-placeholder="false"
          />
        </slot>
      </div>
      <div :class="{col: true, [colSpan]: true}">
        <LabeledInput
          key="description"
          v-model="value.metadata.annotations[ANNOTATION_DESCRIPTION]"
          label="Description"
          :mode="mode"
          :placeholder="descriptionPlaceholder"
          :min-height="30"
          :hide-placeholder="false"
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
