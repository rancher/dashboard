<script>
import Vue from 'vue';
import { _VIEW } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

export default Vue.extend({
  components: {
    Checkbox, LabeledSelect, LabeledInput
  },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:     String,
      required: true
    },

    hasExceptions: {
      type:     Boolean,
      default:  false
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
      options:    ['privileged', 'baseline', 'restricted'],
      controls:   ['enforce', 'audit', 'warn'],
      exceptions: ['Usernames', 'RuntimeClassNames', 'Namespaces']
    };
  },

  watch: {},

  computed: {
    isView() {
      return this.mode === _VIEW;
    }
  },

  created() {
  },

  methods: {}
});
</script>

<template>
  <div>
    <!-- PSA -->
    <p class="helper-text mb-30">
      <t k="podSecurityAdmission.description" />
    </p>

    <div
      v-for="(control, i) in controls"
      :key="'control-' + i"
      class="row row--y-center mb-20"
    >
      <span class="col span-2">
        <Checkbox
          v-model="control.active"
          :data-testid="componentTestid + '--' + i + '-active'"
          :label="control"
          :disabled="isView"
        />
      </span>

      <span class="col span-4">
        <LabeledSelect
          v-model="control.policy"
          :data-testid="componentTestid + '--' + i + '-policy'"
          :disabled="isView"
          :options="options"
          :mode="mode"
        />
      </span>

      <span class="col span-4">
        <LabeledInput
          v-model="control.version"
          :data-testid="componentTestid + '--' + i + '-version'"
          :disabled="isView"
          :options="options"
          :placeholder="t('podSecurityAdmission.version.placeholder', { exception })"
          :mode="mode"
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
        v-for="(exception, i) in exceptions"
        :key="'exception-' + i"
        class="row row--y-center mb-20"
      >
        <span class="col span-2">
          <Checkbox
            v-model="exception.active"
            :data-testid="componentTestid + '--' + i + '-active'"
            :label="exception"
            :disabled="isView"
          />
        </span>
        <span class="col span-8">
          <LabeledInput
            v-model="exception.value"
            :data-testid="componentTestid + '--' + i + '-policy'"
            :disabled="isView"
            :options="options"
            :placeholder="t('podSecurityAdmission.exceptions.placeholder', { exception })"
            :mode="mode"
          />
        </span>
      </div>
    </template>
  </div>
</template>
