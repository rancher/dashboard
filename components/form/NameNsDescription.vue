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
    threeColumn: {
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
    return { wantDescription: !!this.description };
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
      <div :class="{col: true, 'span-6': !threeColumn, 'span-4': threeColumn}">
        <slot name="name">
          <LabeledInput
            v-model="value.metadata.name"
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
      <div :class="{col: true, 'span-6': !threeColumn, 'span-4': threeColumn}">
        <slot name="namespace">
          <LabeledSelect
            v-model="value.metadata.namespace"
            :mode="onlyForCreate"
            :options="namespaces"
            :required="true"
            label="Namespace"
            placeholder="Select a namespace"
          />
        </slot>
      </div>
      <div v-if="threeColumn" class="col span-4">
        <slot name="right">
        </slot>
      </div>
    </div>
    <div v-if="wantDescription || description" class="row">
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
