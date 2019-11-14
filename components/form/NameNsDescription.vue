<script>
import { NAMESPACE, ANNOTATION } from '~/config/types';
import { NAMESPACES } from '@/store/prefs';
import { _CREATE, _VIEW } from '~/config/query-params';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import { escapeRegex } from '@/utils/string';

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
    namespaced: {
      type:    Boolean,
      default: true,
    },
    extraColumns: {
      type:    Array,
      default: null
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
    },
  },

  data() {
    let metadata = this.value.metadata;

    if ( !metadata ) {
      metadata = {};
      this.value.metadata = metadata;
    }

    if ( !metadata.annotations ) {
      metadata.annotations = {};
    }

    if ( !metadata.namespace ) {
      const selectedNS = this.$store.getters['prefs/get'](NAMESPACES)[0] || 'default';

      metadata.namespace = selectedNS;
    }

    const description = metadata.annotations[ANNOTATION.DESCRIPTION];

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
      wantDescription:        !!description,
      ANNOTATION_DESCRIPTION: ANNOTATION.DESCRIPTION,
    };
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
    },

    notView() {
      return this.mode !== _VIEW;
    },

    colSpan() {
      const cols = 1 + (this.namespaced ? 1 : 0) + this.extraColumns.length;
      const span = 12 / cols;

      return `span-${ span }`;
    },
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
};
</script>

<template>
  <div>
    <div class="row">
      <div :class="{col: true, [colSpan]: true}">
        <slot name="name">
          <LabeledInput
            key="name"
            v-model="name"
            :mode="onlyForCreate"
            :label="nameLabel"
            :placeholder="namePlaceholder"
            :required="true"
          >
            <template v-if="notView && !wantDescription" #corner>
              <a href="#" @click.prevent="wantDescription=true">Add a description</a>
            </template>
          </LabeledInput>
        </slot>
      </div>
      <div v-if="namespaced" :class="{col: true, [colSpan]: true}">
        <slot name="namespace">
          <LabeledSelect
            key="namespace"
            v-model="value.metadata.namespace"
            :mode="onlyForCreate"
            :options="namespaces"
            :required="true"
            label="Namespace"
            placeholder="Select a namespace"
          />
        </slot>
      </div>
      <div v-for="slot in extraColumns" :key="slot" :class="{col: true, [colSpan]: true}">
        <slot :name="slot">
        </slot>
      </div>
    </div>
    <div v-if="wantDescription || value.metadata.annotations[ANNOTATION_DESCRIPTION]" class="row">
      <div class="col span-12">
        <LabeledInput
          key="description"
          v-model="value.metadata.annotations[ANNOTATION_DESCRIPTION]"
          type="multiline"
          label="Description"
          :mode="mode"
          :placeholder="descriptionPlaceholder"
        />
      </div>
    </div>
  </div>
</template>
