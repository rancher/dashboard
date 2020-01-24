<script>
import { sortBy } from '@/utils/sort';
import { get } from '@/utils/object';
import { escapeRegex } from '@/utils/string';
import { NAMESPACES } from '@/store/prefs';
import { NAMESPACE, ANNOTATION } from '@/config/types';
import { _CREATE, _VIEW } from '@/config/query-params';
import LabeledInput from '@/components/form/LabeledInput';
import InputWithSelect from '@/components/form/InputWithSelect';

export default {
  components:   { LabeledInput, InputWithSelect },

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
      metadata.annotations = { [ANNOTATION.DESCRIPTION]: '' };
    }

    if ( !metadata.namespace) {
      const selectedNS = this.$store.getters['prefs/get'](NAMESPACES)[0] || 'default';

      metadata.namespace = selectedNS;
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
      ANNOTATION_DESCRIPTION: ANNOTATION.DESCRIPTION,
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
      const cols = 1 + (this.namespaced ? 1 : 0) + this.extraColumns.length;
      const span = 12 / cols;

      return `span-${ span }`;
    },
    description() {
      return get(this.value, `metadata.annotations[${ ANNOTATION.DESCRIPTION }]`);
    },
    wantDescription() {
      return !!this.description || this.addDescription;
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
    const valueRef = get(this.$refs, 'name.$refs.value');

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
    <div class="row">
      <div v-if="namespaced" :class="{col: true, [colSpan]: true}">
        <slot name="namespace">
          <InputWithSelect
            :options="namespaces"
            text-label="Name"
            select-label="Namespace"
            :text-value="name"
            :text-required="true"
            select-value="default"
            @input="changeNameNS"
          />
        </slot>
      </div>
      <div :class="{col: true, [colSpan]: true}">
        <LabeledInput
          key="description"
          v-model="value.metadata.annotations[ANNOTATION_DESCRIPTION]"
          type="multiline"
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
