<script>
import labeledFormElement from '@shell/mixins/labeled-form-element';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Banner from '@shell/components/Banner';
import { _VIEW } from '@shell/config/query-params';

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
        if (e && typeof e === 'object' && e !== undefined) {
          return e.metadata.name;
        }

        return e;
      },
      type: Function
    },
    createOption: {
      default: (text) => {
        if (text) {
          return { metadata: { name: text } };
        }
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
      if (!this.selected) {
        return false;
      }

      return !this.options.find(o => this.reduce(o) === this.serviceName);
    },

    serviceName() {
      return this.reduce(this.selected);
    }

  },

  methods: {
    changeSelected() {
      this.$emit('input', this.serviceName);
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
        :searchable="searchable"
        :clearable="true"
        :disabled="disabled || isView"
        :taggable="taggable"
        :create-option="createOption"
        :multiple="false"
        :mode="mode"
        :option-label="optionLabel"
        :placement="$attrs.placement ? $attrs.placement : null"
        :v-bind="$attrs"
        @input="changeSelected"
      />
      <button
        v-if="!isView"
        type="button"
        class="btn role-secondary"
        data-testid="clear-search"
        @click="clearSearch($event)"
      >
        {{ t("generic.clear") }}
      </button>
    </div>
    <template v-if="serviceNameNew">
      <div class="row span-6">
        <Banner
          color="info"
          v-html="t('workload.serviceAccountName.createMessage', { name: serviceName }) "
        ></Banner>
      </div>
    </template>
  </div>
</template>
