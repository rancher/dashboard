<script>
import labeledFormElement from '@/mixins/labeled-form-element';
import LabeledSearchSelect from '@/components/form/LabeledSearchSelect';
import Banner from '@/components/Banner';
export default {
  components: { LabeledSearchSelect, Banner },

  mixins: [labeledFormElement],

  props: {
    disabled: {
      type:    Boolean,
      default: false,
    },

    searchable: {
      type:    Boolean,
      default: true,
    },

    taggable: {
      type:    Boolean,
      default: true,
    },

    selectLabel: {
      type:    String,
      default: '',
    },

    optionLabel: {
      type:    String,
      default: 'label',
    },

    options: {
      type:     Array,
      required: true,
    },

    selectBeforeText: {
      type:    Boolean,
      default: true,
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
  },

  data() {
    return { selected: this.value || null };
  },

  computed: {
    serviceNameNew() {
      if (this.value !== null) {
        const findSelected = this.options.find(option => this.value === option.metadata.name);

        if (!findSelected) {
          return true;
        }
      }

      return false;
    }
  },

  methods: {
    focus() {
      const comp = this.$refs.text;

      if (comp) {
        comp.focus();
      }
    },

    change() {
      const selectedOption = this.options.find(option => option.metadata.id === this.selected.serviceAccount);

      if (selectedOption) {
        this.$emit('input', selectedOption.metadata.name);
      }
    },

    blurCreate(e) {
      const searched = e;

      if (searched) {
        this.selected = searched;
        this.$emit('input', searched);
      }
    },

    clearSearch(event) {
      this.selected = null;
      this.$emit('input', null);

      event.preventDefault();
    }
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
    <div class="row">
      <div class="col span-5">
        <div
          :class="{ 'select-after': !selectBeforeText }"
          class="servicename-select input-container container-flex"
          @input="change"
        >
          <LabeledSearchSelect
            v-if="selectLabel"
            v-model="selected"
            :label="selectLabel"
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
            @input="change"
            @blur-create="blurCreate"
          />
        </div>
      </div>
      <button class="btn btn-sm clear-btn role-secondary col span-1" @click="clearSearch($event);">
        {{ t('generic.clear') }}
      </button>
    </div>
    <template v-if="serviceNameNew">
      <div class="row span-6">
        <Banner
          color="info"
          v-html="t('workload.serviceAccountName.createMessage', {name: selected}) "
        ></Banner>
      </div>
    </template>
  </div>
</template>

<style lang='scss' scoped>
.clear-btn {
  align-self: center;
  height: 30px;
}

.input-container {
  display: flex;

  &.select-after {
    height: 100%;
    flex-direction: row-reverse;

    & .input-string {
      border-radius: var(--border-radius) 0 0 var(--border-radius);
      border-right: 0;
      border-left: 1px solid var(--border);
    }

    & .in-input {
      border-radius: 0 var(--border-radius) var(--border-radius) 0;
      border-left: 0;
      border-right: 1px solid var(--border);

      &.labeled-select {
        .selected {
          color: var(--input-text);
          text-align: center;
          margin-right: 1em;
        }
      }

    }
  }

  & .input-string {
    padding-right: 0;
    height: 100%;
    width: 60%;
    flex-grow: 1;
    border-radius: var(--border-radius);
    margin-left: -1px;
    position: relative;
    display: table;
    border-collapse: separate;
  }

  & .in-input {
    margin-right: 0;

    &.labeled-select.focused ::v-deep,
    &.unlabeled-select.focused ::v-deep {
      outline: none;
    }

    &.labeled-select ::v-deep,
    &.unlabeled-select ::v-deep {
      box-shadow: none;
      width: 100%;
      border: solid 1px var(--input-border);
      margin-right: 1px; // push the input box right so the full focus outline of the select can be seen, z-index borks
      // position: relative;

      .vs__selected {
        color: var(--input-text);
      }

      .vs__dropdown-menu {
        box-shadow: none;
        .vs__dropdown-option {
          padding: 3px 5px;
        }
      }

      .vs__dropdown-toggle {
        color: var(--primary) !important;
        border-radius: var(--border-radius) 0 0 var(--border-radius);
      }
    }
  }
}

.servicename-select ::v-deep {
  .labeled-select {
    min-width: 40%;
    .v-select.inline {
      &.vs--single {
        padding-bottom: 2px;
      }
    }
  }
}
</style>
