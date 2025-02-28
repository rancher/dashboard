<script lang="ts">
import { defineComponent } from 'vue';
import { _VIEW, _CREATE } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { PSADimension, PSAMode } from '@shell/types/resources/pod-security-admission';
import {
  PSADefaultLevel,
  PSADefaultVersion, PSADimensions, PSALevels, PSAModes
} from '@shell/config/pod-security-admission';
import { pickBy, toDictionary } from '@shell/utils/object';

interface PSAControl { active: boolean, level: string, version: string }
const getPsaControl = (): PSAControl => ({
  active:  false,
  level:   PSADefaultLevel,
  version: ''
});

// Type and function for exemptions form builder
interface PSAExemptionControl { active: boolean, value: string }
const getExemptionControl = (): PSAExemptionControl => ({
  active: false,
  value:  ''
});

export default defineComponent({
  emits: ['updateLabels', 'updateExemptions'],

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

    labelsAlwaysActive: {
      type:    Boolean,
      default: false
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
      // Generate PSA form controls
      psaControls:           toDictionary(PSAModes, getPsaControl) as Record<PSAMode, PSAControl>,
      psaExemptionsControls: toDictionary(PSADimensions, getExemptionControl) as Record<PSADimension, PSAExemptionControl>,
      options:               PSALevels.map((level) => ({
        value: level,
        label: this.t(`podSecurityAdmission.labels.${ level }`)
      })),
    };
  },

  watch: {},

  computed: {
    isView(): boolean {
      return this.mode === _VIEW;
    },

    /**
     * Enable exemption form if any
     */
    hasExemptions(): boolean {
      return Object.keys(this.exemptions).length > 0;
    },
  },

  created() {
    // Assign values to the form, overriding existing values
    this.psaControls = {
      ...this.psaControls,
      ...this.getPsaControls()
    };

    this.psaExemptionsControls = this.getPsaExemptions();

    // Emit initial value on creation if labels always active, as default predefined values are required
    if (this.mode === _CREATE && this.labelsAlwaysActive) {
      this.updateLabels();
      this.updateExemptions();
    }
  },

  methods: {
    /**
     * Filter out existing PSA labels and emit existing labels with new PSA ones
     */
    updateLabels(): void {
      const nonPSALabels = pickBy(this.labels, (_, key) => !key.includes(this.labelsPrefix));
      const labels = PSAModes.reduce((acc, mode) => {
        return this.psaControls[mode]?.active || this.labelsAlwaysActive ? {
          ...acc,
          // Set default level if none
          [`${ this.labelsPrefix }${ mode }`]:         this.psaControls[mode].level || PSADefaultLevel,
          // Set default version if none
          [`${ this.labelsPrefix }${ mode }-version`]: this.psaControls[mode].version || PSADefaultVersion
        } : acc;
      }, nonPSALabels);

      this.$emit('updateLabels', labels);
    },

    /**
     * Emit active exemptions in required format
     */
    updateExemptions(): void {
      const exemptions = PSADimensions.reduce((acc, dimension) => {
        const value = this.psaExemptionsControls[dimension].value.split(',').map((value) => value.trim());
        const active = this.psaExemptionsControls[dimension].active;

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
    getPsaControls(): Record<PSAMode, PSAControl> {
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
     * Generate form exemptions based on PSA exemptions provided dictionary
     */
    getPsaExemptions(): Record<PSADimension, PSAExemptionControl> {
      return PSADimensions.reduce((acc, dimension) => {
        const values = (this.exemptions[dimension] || []).map((value) => value.trim()).join(',');

        return {
          ...acc,
          [dimension]: {
            active: !!values.length,
            value:  values
          }
        };
      }, {}) as Record<PSADimension, PSAExemptionControl>;
    },

    /**
     * Add checks on input for PSA controls to be active or not, allowing white cases
     */
    isPsaControlDisabled(active: boolean): boolean {
      return !this.labelsAlwaysActive && (!active || this.isView);
    }
  }
});
</script>

<template>
  <div class="psa">
    <!-- PSA -->
    <p class="mb-30">
      <t k="podSecurityAdmission.description" />
    </p>

    <div
      v-for="(psaControl, level, i) in psaControls"
      :key="i"
      class="row row--y-center mb-20"
    >
      <span class="col span-2">
        <Checkbox
          v-if="!labelsAlwaysActive"
          v-model:value="psaControl.active"
          :data-testid="componentTestid + '--psaControl-' + i + '-active'"
          :label="level"
          :label-key="`podSecurityAdmission.labels.${ level }`"
          :disabled="isView"
          @update:value="updateLabels()"
        />
        <p v-else>
          <t
            :id="`psa-label-for-level-${ level }`"
            :k="`podSecurityAdmission.labels.${level}`"
          />
        </p>
      </span>

      <span class="col span-4">
        <LabeledSelect
          v-model:value="psaControl.level"
          :aria-labelledby="`psa-label-for-level-${ level }`"
          :data-testid="componentTestid + '--psaControl-' + i + '-level'"
          :disabled="isPsaControlDisabled(psaControl.active)"
          :options="options"
          :mode="mode"
          @update:value="updateLabels()"
        />
      </span>

      <span class="col span-4">
        <LabeledInput
          v-model:value="psaControl.version"
          :data-testid="componentTestid + '--psaControl-' + i + '-version'"
          :disabled="isPsaControlDisabled(psaControl.active)"
          :options="options"
          :placeholder="t('podSecurityAdmission.version.placeholder', { psaControl: mode })"
          :mode="mode"
          :aria-label="`${t(`podSecurityAdmission.labels.${level}`)} - ${t('podSecurityAdmission.version.placeholder', { psaControl: mode })}`"
          @update:value="updateLabels()"
        />
      </span>
    </div>

    <!-- Exemptions -->
    <template v-if="hasExemptions">
      <slot name="title">
        <h3>
          <t k="podSecurityAdmission.exemptions.title" />
        </h3>
      </slot>
      <p class="mb-30">
        <t k="podSecurityAdmission.exemptions.description" />
      </p>

      <div
        v-for="(psaExemptionsControl, dimension, i) in psaExemptionsControls"
        :key="i"
        class="row row--y-center mb-20"
      >
        <span class="col span-2">
          <Checkbox
            v-model:value="psaExemptionsControl.active"
            :data-testid="componentTestid + '--psaExemptionsControl-' + i + '-active'"
            :label="dimension"
            :label-key="`podSecurityAdmission.labels.${ dimension }`"
            :disabled="isView"
            @update:value="updateExemptions()"
          />
        </span>
        <span class="col span-8">
          <LabeledInput
            v-model:value="psaExemptionsControl.value"
            :data-testid="componentTestid + '--psaExemptionsControl-' + i + '-value'"
            :disabled="(isView || !psaExemptionsControl.active)"
            :options="options"
            :placeholder="t('podSecurityAdmission.exemptions.placeholder', { psaExemptionsControl: dimension })"
            :mode="mode"
            :aria-label="`${t(`podSecurityAdmission.labels.${ dimension }`)} - ${t('podSecurityAdmission.exemptions.placeholder', { psaExemptionsControl: dimension })}`"
            @update:value="updateExemptions()"
          />
        </span>
      </div>
    </template>
  </div>
</template>
