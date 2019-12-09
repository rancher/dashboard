<script>
import { get } from '../../utils/object';
import { sortBy } from '../../utils/sort';
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
    },
    registerBeforeHook: {
      type:    Function,
      default: null
    }
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
      toCreate:               ''
    };
  },
  inject:   { disableInputs: { default: false } },
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
    description: {
      get() {
        return this.value.metadata.annotations[ANNOTATION.DESCRIPTION];
      },
      set(val) {
        this.value.metadata.annotations[ANNOTATION.DESCRIPTION] = val;
      }
    },
    wantDescription() {
      return !!get(this.value, `metadata.annotations.${ ANNOTATION.DESCRIPTION }`);
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
  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.createNamespace);
    }
  },
  methods: {
    toggleNSMode() {
      this.createNS = !this.createNS;
    },
    async createNamespace() {
      if (this.createNS) {
        if (!this.toCreate) {
          throw new Error('no namespace name provided');
        } else {
          try {
            const nsSchema = this.$store.getters['cluster/schemaFor'](NAMESPACE);
            const data = { metadata: { name: this.toCreate } };

            await nsSchema.followLink('collection', {
              method:  'POST',
              data
            });
            this.value.metadata.namespace = this.toCreate;
          } catch (err) {
            throw err;
          }
        }
      }
    }
  }
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
              <a v-if="!disableInputs" href="#" @click.prevent="wantDescription=true">Add a description</a>
            </template>
          </LabeledInput>
        </slot>
      </div>
      <div v-if="namespaced" :class="{col: true, [colSpan]: true}">
        <slot name="namespace">
          <LabeledInput v-if="createNS" v-model="toCreate" required label="Namespace" placeholder="e.g. myapp">
            <template #corner>
              <a v-if="!disableInputs" href="#" @click.prevent="toggleNSMode">
                Use an existing namespace
              </a>
            </template>
          </LabeledInput>
          <LabeledSelect
            v-else
            key="namespace"
            v-model="value.metadata.namespace"
            :mode="onlyForCreate"
            :options="namespaces"
            :required="true"
            label="Namespace"
            placeholder="Select a namespace"
          >
            <template #corner>
              <a v-if="registerBeforeHook && !disableInputs" href="#" @click.prevent="toggleNSMode">
                Create new namespace
              </a>
            </template>
          </LabeledSelect>
        </slot>
      </div>
      <div v-for="slot in extraColumns" :key="slot" :class="{col: true, [colSpan]: true}">
        <slot :name="slot">
        </slot>
      </div>
    </div>
    <div v-if="wantDescription" class="row">
      <div class="col span-12">
        <div>
          <LabeledInput
            key="description"
            v-model="description"
            type="multiline"
            label="Description"
            :mode="mode"
            :placeholder="descriptionPlaceholder"
            :min-height="30"
          />
        </div>
      </div>
    </div>
  </div>
</template>
