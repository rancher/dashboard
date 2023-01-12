<script lang="ts">
import Vue from 'vue';
import { _VIEW } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { PSADimension, PSAMode } from '@shell/types/pod-security-admission';
import {
  PSADefaultLevel,
  PSADefaultVersion, PSADimensions, PSALevels, PSAModes
} from '@shell/config/pod-security-admission';
import { pickBy } from '@shell/utils/object';

interface PSAControl { active: boolean, level: string, version: string }
const control = (): PSAControl => ({
  active:  false,
  level:   PSADefaultLevel,
  version: ''
});

// Type and function for exceptions form builder
interface PSAException { active: boolean, value: string }
const exception = (): PSAException => ({
  active: false,
  value:  ''
});

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
      type:    Object as () => Record<string, string>,
      default: () => ({})
    },

    /**
     * Map editing capabilities to the component
     */
    mode: {
      type:     String,
      required: true
    },

    /**
     * List of exemptions used for the resource
     */
    exemptions: {
      type:    Object as () => Record<PSADimension, string[]>,
      default: () => ({} as Record<PSADimension, string[]>)
    },

    /**
     * Prefix used for setting labels
     */
    labelsPrefix: {
      type:    String,
      default: ''
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
      controls:   Object.assign({}, ...PSAModes.map(mode => ({ [mode]: control() }))),
      exceptions: Object.assign({}, ...PSADimensions.map(dimension => ({ [dimension]: exception() }))),
      options:    PSALevels,
    };
  },

  watch: {},

  computed: {
    isView(): boolean {
      return this.mode === _VIEW;
    },

    /**
     * Enable exemption view if any
     */
    hasExemptions(): boolean {
      return Object.keys(this.exemptions).length > 0;
    },
  },

  created() {
    // Assign values to the form, overriding existing values
    this.controls = {
      ...this.controls,
      ...this.getControls()
    };

    this.exceptions = this.getExceptions();
  },

  methods: {
    /**
     * Filter out existing PSA labels and emit existing labels with new PSA ones
     */
    updateLabels(): void {
      const nonPSALabels = pickBy(this.labels, (_, key) => !key.includes(this.labelsPrefix));
      const labels = PSAModes.reduce((acc, mode) => {
        return this.controls[mode].active ? {
          ...acc,
          // Set default level if none
          [`${ this.labelsPrefix }${ mode }`]:         this.controls[mode].level || PSADefaultLevel,
          // Set default version if none
          [`${ this.labelsPrefix }${ mode }-version`]: this.controls[mode].version || PSADefaultVersion
        } : acc;
      }, nonPSALabels);

      this.$emit('updateLabels', labels);
    },

    updateExemptions(): void {
      const exemptions = PSADimensions.reduce((acc, dimension) => {
        const value = this.exceptions[dimension].value.split(', ');
        const active = this.exceptions[dimension].active;

        return {
          ...acc,
          [dimension]: active && value ? value : []
        };
      }, {});

      this.$emit('updateExemptions', exemptions);
    },

    /**
     * Generate form controls based on PSA labels in the provided dictionary
     */
    getControls(): Record<PSAMode, PSAControl> {
      return PSAModes.reduce((acc, mode) => {
        const level = this.labels[`${ this.labelsPrefix }${ mode }`];
        // Retrieve version, hiding the value 'latest' from the user
        const version = (this.labels[`${ this.labelsPrefix }${ mode }-version`] || '').replace(PSADefaultVersion, '');

        return level ? {
          ...acc,
          [mode]: {
            active: true,
            level,
            version
          }
        } : acc;
      }, {} as Record<PSAMode, PSAControl>);
    },

    /**
     * Generate form exceptions based on PSA exemptions provided dictionary
     */
    getExceptions(): Record<PSADimension, PSAException> {
      return PSADimensions.reduce((acc, dimension) => {
        const values = (this.exemptions[dimension] || []).join(', ');

        return {
          ...acc,
          [dimension]: {
            active: !!values.length,
            value:  values
          }
        };
      }, {}) as Record<PSADimension, PSAException>;
    }
  }
});
</script>

<template>
  <div class="psa">
    <!-- PSA -->
    <p class="helper-text mb-30">
      <t k="podSecurityAdmission.description" />
    </p>

    <div
      v-for="(control, level, i) in controls"
      :key="'control-' + i"
      class="row row--y-center mb-20"
    >
      <span class="col span-2 psa-checkbox">
        <Checkbox
          v-model="control.active"
          :data-testid="componentTestid + '--control-' + i + '-active'"
          :label="level"
          :disabled="isView"
          @input="updateLabels()"
        />
      </span>

      <span class="col span-4">
        <LabeledSelect
          v-model="control.level"
          :data-testid="componentTestid + '--control-' + i + '-level'"
          :disabled="(isView || !control.active)"
          :options="options"
          :mode="mode"
          @input="updateLabels()"
        />
      </span>

      <span class="col span-4">
        <LabeledInput
          v-model="control.version"
          :data-testid="componentTestid + '--control-' + i + '-version'"
          :disabled="(isView || !control.active)"
          :options="options"
          :placeholder="t('podSecurityAdmission.version.placeholder', { control: mode })"
          :mode="mode"
          @input="updateLabels()"
        />
      </span>
    </div>

    <!-- Exemptions -->
    <template v-if="hasExemptions">
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
            :data-testid="componentTestid + '--exception-' + i + '-active'"
            :label="dimension"
            :disabled="isView"
            @input="updateExemptions()"
          />
        </span>
        <span class="col span-8">
          <LabeledInput
            v-model="exception.value"
            :data-testid="componentTestid + '--exception-' + i + '-value'"
            :disabled="(isView || !exception.active)"
            :options="options"
            :placeholder="t('podSecurityAdmission.exceptions.placeholder', { exception: dimension })"
            :mode="mode"
            @input="updateExemptions()"
          />
        </span>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.psa .row {
    .psa-checkbox {
      display: flex;
      align-items: center;
    }
}
</style>
