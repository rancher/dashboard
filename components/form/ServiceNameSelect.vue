<script>
import labeledFormElement from '@/mixins/labeled-form-element';
import LabeledSelect from '@/components/form/LabeledSelect';
import Banner from '@/components/Banner';
import { _VIEW } from '@/config/query-params';

export default {
  components: { LabeledSelect, Banner },

  mixins: [labeledFormElement],

  props: {
    disabled: {
      type:    Boolean,
      default: false,
    },
    mode: {
      type:    String,
      default: 'create'
    },
    optionLabel: {
      type:    String,
      default: 'label',
    },
    options: {
      type:     Array,
      required: true,
    },
    reduce: {
      default: (e) => {
        if (e && typeof e === 'object' && e.value !== undefined) {
          return e.value;
        }

        return e;
      },
      type: Function
    },
    searchable: {
      type:    Boolean,
      default: true,
    },
    selectLabel: {
      type:    String,
      default: null,
    },
    selectBeforeText: {
      type:    Boolean,
      default: true,
    },
    taggable: {
      type:    Boolean,
      default: true,
    },
  },

  data() {
    return { selected: this.value };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    serviceNameNew() {
      if (this.selected && this.selected !== '') {
        const findSelected = this.options.find(option => this.value === option.metadata.name);

        if (!findSelected) {
          return true;
        }
      }

      return false;
    }
  },

  methods: {
    changeSelected() {
      const selectString = this.selected.toString();

      const selectedOption = this.options.find((option) => {
        const optString = `[${ option.type }: ${ option.id }]`;

        if (optString === selectString) {
          return option;
        }

        return null;
      });

      if (selectedOption) {
        this.$emit('input', selectedOption.metadata.name);
      } else {
        this.$emit('input', null);
      }
    },

    clearSearch(event) {
      this.selected = '';
      this.$emit('input', null);

      event.preventDefault();
    },

    focus() {
      const comp = this.$refs.text;

      if (comp) {
        comp.focus();
      }
    },
  },
};
</script>

<template>
  <div>
    <div class="spacer"></div>
    <div class="row mb-10">
      <h3 class="col span-6">
        {{ t('workload.serviceAccountName.label') }}
      </h3>
    </div>
    <div class="row span-6">
      <LabeledSelect
        v-model="selected"
        :label="selectLabel"
        class="mr-10"
        :class="{ 'in-input': !isView }"
        :options="options"
        :searchable="true"
        :clearable="true"
        :disabled="disabled || isView"
        :taggable="taggable"
        :create-option="(name) => (name)"
        :reduce="(name) => `${name}`"
        :multiple="false"
        :mode="mode"
        :option-label="optionLabel"
        :placement="$attrs.placement ? $attrs.placement : null"
        :v-bind="$attrs"
        @input="changeSelected"
      />
      <button :disabled="isView" type="button" class="btn role-secondary" @click="clearSearch($event);">
        {{ t('generic.clear') }}
      </button>
    </div>
    <template v-if="serviceNameNew">
      <div class="row span-6">
        <Banner
          color="info"
          v-html="t('workload.serviceAccountName.createMessage', { name: selected }) "
        ></Banner>
      </div>
    </template>
  </div>
</template>
