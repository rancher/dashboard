<script lang="ts">
import Vue from 'vue';
import { _VIEW } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { PSADimension, PSAMode } from '@shell/types/pod-security-admission';

export default Vue.extend({
  components: {
    Checkbox, LabeledSelect, LabeledInput
  },
  props: {
    /**
     * List of labels used for the resource
     * Note: PSA labels are always paired
     */
    labels: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    mode: {
      type:     String,
      required: true
    },

    /**
     * Conditionally show users restrictions
     */
    hasExceptions: {
      type:    Boolean,
      default: false
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'pod-security-admission'
    }
  },

  data() {
    return {
      controls: {
        enforce: {
          active:  false,
          policy:  null,
          version: null
        },
        audit: {
          active:  false,
          policy:  null,
          version: null
        },
        warn: {
          active:  false,
          policy:  null,
          version: null
        },
      },
      exceptions: {
        Usernames: {
          active: false,
          value:  null
        },
        RuntimeClassNames: {
          active: false,
          value:  null
        },
        Namespaces: {
          active: false,
          value:  null
        },
      },
      options: ['privileged', 'baseline', 'restricted'],
    };
  },

  watch: {},

  computed: {
    isView(): boolean {
      return this.mode === _VIEW;
    }
  },

  created() {
  },

  methods: {
    toggleLabel(mode: PSAMode) {
      // this.$emit('toggleLabel', label);
    },
    toggleException(dimension: PSADimension) {
      // this.$emit('toggleException', label);
    },
  }
});
</script>

<template>
  <div>
    <!-- PSA -->
    <p class="helper-text mb-30">
      <t k="podSecurityAdmission.description" />
    </p>

    <div
      v-for="(control, level, i) in controls"
      :key="'control-' + i"
      class="row row--y-center mb-20"
    >
      <span class="col span-2">
        <Checkbox
          v-model="control.active"
          :data-testid="componentTestid + '--' + i + '-active'"
          :label="level"
          :disabled="isView"
          @input="toggleLabel(level)"
        />
      </span>

      <span class="col span-4">
        <LabeledSelect
          v-model="control.policy"
          :data-testid="componentTestid + '--' + i + '-policy'"
          :disabled="isView"
          :options="options"
          :mode="mode"
          @input="toggleLabel(level)"
        />
      </span>

      <span class="col span-4">
        <LabeledInput
          v-model="control.version"
          :data-testid="componentTestid + '--' + i + '-version'"
          :disabled="isView"
          :options="options"
          :placeholder="t('podSecurityAdmission.version.placeholder', { control: level })"
          :mode="mode"
          @input="toggleLabel(level)"
        />
      </span>
    </div>

    <!-- Exceptions -->
    <template v-if="hasExceptions">
      <slot name="title">
        <h3>
          <t k="podSecurityAdmission.exceptions.title" />
        </h3>
      </slot>
      <p class="helper-text mb-30">
        <t k="podSecurityAdmission.exceptions.description" />
      </p>

      <div
        v-for="(exception, dimension, i) in exceptions"
        :key="'exception-' + i"
        class="row row--y-center mb-20"
      >
        <span class="col span-2">
          <Checkbox
            v-model="exception.active"
            :data-testid="componentTestid + '--' + i + '-active'"
            :label="dimension"
            :disabled="isView"
            @input="toggleException(dimension)"
          />
        </span>
        <span class="col span-8">
          <LabeledInput
            v-model="exception.value"
            :data-testid="componentTestid + '--' + i + '-policy'"
            :disabled="isView"
            :options="options"
            :placeholder="t('podSecurityAdmission.exceptions.placeholder', { exception: dimension })"
            :mode="mode"
            @input="toggleException(dimension)"
          />
        </span>
      </div>
    </template>
  </div>
</template>
