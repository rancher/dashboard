<script lang="ts">
import Vue from 'vue';
import { _VIEW } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { PSAMode } from '@shell/types/pod-security-admission';
import {
  PSADefaultLevel,
  PSADefaultVersion, PSADimensions, PSALabelPrefix, PSALevels, PSAModes
} from '@shell/config/pod-security-admission';
import { pickBy } from '@shell/utils/object';

interface PSAControl { active: boolean, level: string, version: string }
const control = (): PSAControl => ({
  active:  false,
  level:   PSADefaultLevel,
  version: ''
});

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
      default: () => {
        return {};
      }
    },

    /**
     * Map editing capabilities to the component
     */
    mode: {
      type:     String,
      required: true
    },

    /**
     * Conditionally show users restrictions
     * TODO: Integrate with #7628
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
      controls:   Object.assign({}, ...PSAModes.map(mode => ({ [mode]: control() }))),
      exceptions: Object.assign({}, ...PSADimensions.map(dimension => ({ [dimension]: exception() }))),
      options:    PSALevels,
    };
  },

  watch: {},

  computed: {
    isView(): boolean {
      return this.mode === _VIEW;
    }
  },

  created() {
    // Assign values to the form, overriding existing values
    const controls = {
      ...this.controls,
      ...this.getControls()
    };

    this.controls = Object.keys(controls)
      .sort()
      .reduce((res, key) => {
        res[key] = controls[key];

        return res;
      }, {} as any);
  },

  methods: {
    /**
     * Filter out existing PSA labels and emit existing labels with new PSA ones
     */
    toggleLabel(): void {
      const nonPSALabels = pickBy(this.labels, (_, key) => !key.includes(PSALabelPrefix));
      const labels = PSAModes.reduce((acc, mode) => {
        return this.controls[mode].active ? {
          ...acc,
          // Set default level if none
          [`${ PSALabelPrefix }${ mode }`]:         this.controls[mode].level || PSADefaultLevel,
          // Set default version if none
          [`${ PSALabelPrefix }${ mode }-version`]: this.controls[mode].version || PSADefaultVersion
        } : acc;
      }, nonPSALabels);

      this.$emit('updateLabels', labels);
    },

    toggleException(): void {
      // TODO: #7628 Complete implementation when PSA templates are available from the server
      // this.$emit('toggleException', dimensions);
    },

    /**
     * Generate view controls based on PSA labels in the "value" resource
     */
    getControls(): Record<PSAMode, PSAControl> {
      return PSAModes.reduce((acc, mode) => {
        const level = this.labels[`${ PSALabelPrefix }${ mode }`];
        // Retrieve version, hiding the value 'latest' from the user
        const version = (this.labels[`${ PSALabelPrefix }${ mode }-version`] || '').replace(PSADefaultVersion, '');

        return level ? {
          ...acc,
          [mode]: {
            active: true,
            level,
            version
          }
        } : acc;
      }, {} as Record<PSAMode, PSAControl>);
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
          :data-testid="componentTestid + '--' + i + '-active'"
          :label="level"
          :disabled="isView"
          @input="toggleLabel()"
        />
      </span>

      <span class="col span-4">
        <LabeledSelect
          v-model="control.level"
          :data-testid="componentTestid + '--' + i + '-level'"
          :disabled="(isView || !control.active)"
          :options="options"
          :mode="mode"
          @input="toggleLabel()"
        />
      </span>

      <span class="col span-4">
        <LabeledInput
          v-model="control.version"
          :data-testid="componentTestid + '--' + i + '-version'"
          :disabled="(isView || !control.active)"
          :options="options"
          :placeholder="t('podSecurityAdmission.version.placeholder', { control: mode })"
          :mode="mode"
          @input="toggleLabel()"
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
            @input="toggleException()"
          />
        </span>
        <span class="col span-8">
          <LabeledInput
            v-model="exception.value"
            :data-testid="componentTestid + '--' + i + '-value'"
            :disabled="isView"
            :options="options"
            :placeholder="t('podSecurityAdmission.exceptions.placeholder', { exception: dimension })"
            :mode="mode"
            @input="toggleException()"
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
