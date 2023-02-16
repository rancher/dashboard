<script>
import Select from '@shell/components/form/Select';
import UnitInput from '@shell/components/form/UnitInput';
import PercentageBar from '@shell/components/PercentageBar';
import { formatSi, parseSi } from '@shell/utils/units';

export default {
  components: {
    Select, PercentageBar, UnitInput
  },

  props: {
    mode: {
      type:     String,
      required: true,
    },
    types: {
      type:    Array,
      default: () => []
    },
    type: {
      type:     String,
      required: true
    },
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    namespace: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    storageClass: {
      type:    String,
      default: ''
    },
    storageClasses: {
      type:    Array,
      default: () => {
        return [];
      }
    },
    projectResourceQuotaLimits: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    namespaceResourceQuotaLimits: {
      type:    Array,
      default: () => {
        return [];
      }
    },
    defaultResourceQuotaLimits: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  mounted() {
    // We want to update the value first so that the value will be rounded to the project limit.
    // This is relevant when switching projects. If the value is 1200 and the project that it was
    // switched to only has capacity for 800 more this will force the value to be set to 800.
    if (this.value?.limit?.[this.type]) {
      this.update(this.limit);
    }

    if (!this.value?.limit?.[this.type]) {
      this.update(this.drqLimts);
    }
  },

  computed: {
    typeOption() {
      return this.types.find(type => type.value === this.type);
    },
    scOption() {
      return this.storageClasses.map(sc => ({ label: sc.id, value: sc.id }));
    },
    limitValue() {
      return parseSi(this.prqLimits);
    },
    prqLimits() {
      const sc = this.storageClass;

      return this.storageClass ? this.projectResourceQuotaLimits[this.type][sc] : this.projectResourceQuotaLimits[this.type];
    },
    drqLimts() {
      const sc = this.storageClass;

      return this.storageClass ? this.defaultResourceQuotaLimits[this.type][sc] : this.defaultResourceQuotaLimits[this.type];
    },
    siOptions() {
      return {
        maxExponent: this.typeOption.inputExponent,
        minExponent: this.typeOption.inputExponent,
        increment:   this.typeOption.increment,
        suffix:      this.typeOption.increment === 1024 ? 'i' : ''
      };
    },
    namespaceLimits() {
      const sc = this.storageClass;

      return this.namespaceResourceQuotaLimits
        .filter(resourceQuota => resourceQuota[this.type] && resourceQuota.id !== this.namespace.id)
        .map(resourceQuota => parseSi(sc ? resourceQuota[this.type]?.[sc] : resourceQuota[this.type], this.siOptions));
    },
    namespaceContribution() {
      return this.namespaceLimits.reduce((sum, limit) => sum + limit, 0);
    },
    totalContribution() {
      return this.namespaceContribution + parseSi(this.limit || '0', this.siOptions);
    },
    percentageUsed() {
      return Math.min(this.totalContribution * 100 / this.projectLimit, 100);
    },
    projectLimit() {
      return parseSi(this.prqLimits || 0, this.siOptions);
    },
    max() {
      return this.projectLimit - this.namespaceContribution;
    },
    availableResourceQuotas() {
      return formatSi(this.projectLimit - this.totalContribution, { ...this.siOptions, addSuffixSpace: false });
    },
    slices() {
      const out = [];

      this.namespaceLimits.forEach((limit, i) => {
        const lastValue = i > 0 ? this.namespaceLimits[i - 1] : 0;
        const sliceTotal = lastValue + limit;

        out.push(sliceTotal * 100 / this.projectLimit);
      });

      return out;
    },
    limit() {
      const sc = this.storageClass;

      return sc ? this.value.limit[this.type]?.[sc] : this.value.limit[this.type];
    },
    tooltip() {
      const t = this.$store.getters['i18n/t'];
      const out = [
        {
          label: t('resourceQuota.tooltip.reserved'),
          value: formatSi(this.namespaceContribution, { ...this.siOptions, addSuffixSpace: false }),
        },
        {
          label: t('resourceQuota.tooltip.namespace'),
          value: this.limit
        },
        {
          label: t('resourceQuota.tooltip.available'),
          value: this.availableResourceQuotas
        },
        {
          label: t('resourceQuota.tooltip.max'),
          value: this.prqLimits
        }
      ];

      let formattedTooltip = '<div class="quota-percentage-tooltip">';

      (out || []).forEach((v) => {
        formattedTooltip += `
        <div style='margin-top: 5px; display: flex; justify-content: space-between;'>
          ${ v.label }
          <span style='margin-left: 20px;'>${ v.value }</span>
        </div>`;
      });
      formattedTooltip += '</div>';

      return formattedTooltip;
    },

  },

  methods: {
    update(newValue) {
      const parsedNewValue = parseSi(newValue, this.siOptions) || 0;
      const min = Math.max(parsedNewValue, 0);
      const max = Math.min(min, this.max);
      const value = formatSi(max, {
        ...this.siOptions,
        addSuffixSpace: false
      });

      this.$emit('input', this.type, value, this.storageClass);
    }
  }
};
</script>
<template>
  <div
    v-if="typeOption"
    class="ns-quota__row mb-10"
  >
    <div
      v-if="storageClass"
      class="type-with-sc"
    >
      <Select
        :mode="mode"
        :value="type"
        :disabled="true"
        :options="types"
      />
      <Select

        :mode="mode"
        :value="storageClass"
        :disabled="true"
        :options="scOption"
      />
    </div>
    <Select
      v-else
      :mode="mode"
      :value="type"
      :disabled="true"
      :options="types"
    />
    <div>
      <PercentageBar
        v-tooltip="tooltip"
        class="percentage-bar"
        :value="percentageUsed"
        :slices="slices"
        :color-stops="{'100': '--primary'}"
      />
    </div>
    <UnitInput
      :value="limit"
      :mode="mode"
      :placeholder="typeOption.placeholder"
      :increment="typeOption.increment"
      :input-exponent="typeOption.inputExponent"
      :base-unit="typeOption.baseUnit"
      :suffix="typeOption.suffix"
      :output-modifier="true"
      @input="update"
    />
  </div>
</template>

<style lang='scss' scoped>
  .ns-quota__row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    align-items: center;
    column-gap: 10px;
    & > div:first-child {
      align-self: stretch;
    }
  }
  .type-with-sc {
    display: grid;
    grid-template-columns: 1fr;
    row-gap: 4px;
  }
</style>
