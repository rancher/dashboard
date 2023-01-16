<script>

import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _EDIT } from '@shell/config/query-params';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import { convert, matching, simplify } from '@shell/utils/selector';
import { POD } from '@shell/config/types';
import ArrayList from '@shell/components/form/ArrayList';
import { Banner } from '@components/Banner';
import throttle from 'lodash/throttle';
import { isValidCIDR } from '@shell/utils/validators/cidr';

const TARGET_OPTION_IP_BLOCK = 'ipBlock';
const TARGET_OPTION_NAMESPACE_SELECTOR = 'namespaceSelector';
const TARGET_OPTION_POD_SELECTOR = 'podSelector';

export default {
  components: {
    ArrayList, Banner, LabeledInput, LabeledSelect, MatchExpressions
  },
  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },
    mode: {
      type:    String,
      default: _EDIT,
    },
    type: {
      type:    String,
      default: 'ingress'
    },
    namespace: {
      type:    String,
      default: ''
    },
    allPods: {
      type:    Array,
      default: () => {
        return [];
      },
    },
    allNamespaces: {
      type:    Array,
      default: () => {
        return [];
      },
    },
  },
  data() {
    if (!this.value[TARGET_OPTION_IP_BLOCK] && !this.value[TARGET_OPTION_POD_SELECTOR] && !this.value[TARGET_OPTION_NAMESPACE_SELECTOR]) {
      this.$nextTick(() => {
        this.$set(this.value, TARGET_OPTION_IP_BLOCK, {});
      });
    }

    const matchingPods = this.getMatchingPods();
    const matchingNamespaces = this.getMatchingNamespaces();

    return {
      portOptions:   ['TCP', 'UDP'],
      matchingPods,
      matchingNamespaces,
      invalidCidr:   null,
      invalidCidrs:  [],
      TARGET_OPTION_IP_BLOCK,
      TARGET_OPTION_NAMESPACE_SELECTOR,
      TARGET_OPTION_POD_SELECTOR,
      POD,
      targetOptions: [
        TARGET_OPTION_IP_BLOCK,
        TARGET_OPTION_NAMESPACE_SELECTOR,
        TARGET_OPTION_POD_SELECTOR
      ],
    };
  },
  computed: {
    podSelectorExpressions: {
      get() {
        return convert(
          this.value[TARGET_OPTION_POD_SELECTOR]?.matchLabels || {},
          this.value[TARGET_OPTION_POD_SELECTOR]?.matchExpressions || []
        );
      },
      set(podSelectorExpressions) {
        this.$set(this.value, TARGET_OPTION_POD_SELECTOR, simplify(podSelectorExpressions));
      }
    },
    namespaceSelectorExpressions: {
      get() {
        return convert(
          this.value[TARGET_OPTION_NAMESPACE_SELECTOR]?.matchLabels || {},
          this.value[TARGET_OPTION_NAMESPACE_SELECTOR]?.matchExpressions || []
        );
      },
      set(namespaceSelectorExpressions) {
        this.$set(this.value, TARGET_OPTION_NAMESPACE_SELECTOR, simplify(namespaceSelectorExpressions));
      }
    },
    selectTargetOptions() {
      const selectTargetOptions = [];

      for (const option of this.targetOptions) {
        selectTargetOptions.push({
          label: this.t(`networkpolicy.rules.${ option }.label`),
          value: option,
        });
      }

      return selectTargetOptions;
    },
    targetType: {
      get() {
        for (const option of this.targetOptions) {
          if (this.value[option]) {
            return option;
          }
        }

        return null;
      },
      set(targetType) {
        this.$delete(this.value, TARGET_OPTION_IP_BLOCK);
        this.$delete(this.value, TARGET_OPTION_NAMESPACE_SELECTOR);
        this.$delete(this.value, TARGET_OPTION_POD_SELECTOR);
        this.$nextTick(() => {
          this.$set(this.value, targetType, {});
        });
      }
    }
  },
  watch: {
    namespace:                    'updateMatches',
    'value.podSelector':          'updateMatches',
    'value.namespaceSelector':    'updateMatches',
    'value.ipBlock.cidr':         'validateCIDR',
    'value.ipBlock.except':       'validateCIDR',
    podSelectorExpressions:       'updateMatches',
    namespaceSelectorExpressions: 'updateMatches',
  },
  methods: {
    validateCIDR() {
      const exceptCidrs = this.value[TARGET_OPTION_IP_BLOCK]?.except || [];

      this.invalidCidrs = exceptCidrs
        .filter(cidr => !isValidCIDR(cidr))
        .map(invalidCidr => invalidCidr || '<blank>');

      if (this.value[TARGET_OPTION_IP_BLOCK]?.cidr && !isValidCIDR(this.value[TARGET_OPTION_IP_BLOCK].cidr)) {
        this.invalidCidr = this.value[TARGET_OPTION_IP_BLOCK].cidr;
      } else {
        this.invalidCidr = null;
      }
    },
    updateMatches: throttle(function() {
      this.matchingPods = this.getMatchingPods();
      this.matchingNamespaces = this.getMatchingNamespaces();
    }, 250, { leading: true }),
    getMatchingPods() {
      const allInNamespace = this.allPods.filter(pod => pod.metadata.namespace === this.namespace);
      const match = matching(allInNamespace, this.podSelectorExpressions);
      const matched = match.length || 0;
      const sample = match[0]?.nameDisplay;

      return {
        matched,
        matches: match,
        none:    matched === 0,
        sample,
        total:   allInNamespace.length,
      };
    },
    getMatchingNamespaces() {
      const allNamespaces = this.allNamespaces;
      const match = matching(allNamespaces, this.namespaceSelectorExpressions);
      const matched = match.length || 0;
      const sample = match[0]?.nameDisplay;

      return {
        matched,
        matches: match,
        none:    matched === 0,
        sample,
        total:   allNamespaces.length,
      };
    },
  }
};
</script>

<template>
  <div class="rule">
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledSelect
          v-model="targetType"
          :mode="mode"
          :options="selectTargetOptions"
          :multiple="false"
          :label="t('networkpolicy.rules.type')"
        />
      </div>
    </div>
    <div v-if="targetType === TARGET_OPTION_IP_BLOCK">
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model="value[TARGET_OPTION_IP_BLOCK].cidr"
            :mode="mode"
            :placeholder="t('networkpolicy.rules.ipBlock.cidr.placeholder')"
            :label="t('networkpolicy.rules.ipBlock.cidr.label')"
          />
        </div>
      </div>
      <div
        v-if="invalidCidr"
        class="row"
      >
        <div class="col span-12">
          <Banner color="error">
            <t k="networkpolicy.rules.ipBlock.invalidCidr" />
          </Banner>
        </div>
      </div>
      <div class="row mt-20">
        <div class="col span-12">
          <ArrayList
            v-model="value[TARGET_OPTION_IP_BLOCK].except"
            :add-label="t('networkpolicy.rules.ipBlock.addExcept')"
            :mode="mode"
            :show-header="true"
            :value-label="t('networkpolicy.rules.ipBlock.exceptions')"
            :value-placeholder="t('networkpolicy.rules.ipBlock.cidr.placeholder')"
          />
        </div>
      </div>
      <div
        v-if="invalidCidrs.length"
        class="row mb-10"
      >
        <div class="col span-12">
          <Banner color="error">
            <t k="networkpolicy.rules.ipBlock.invalidExceptionCidrs" />{{ invalidCidrs.join(', ') }}
          </Banner>
        </div>
      </div>
    </div>
    <div v-if="targetType === TARGET_OPTION_POD_SELECTOR">
      <div class="row">
        <div class="col span-12">
          <Banner color="success">
            <span v-html="t('networkpolicy.selectors.matchingPods.matchesSome', matchingPods)" />
          </Banner>
        </div>
      </div>
      <div class="row mb-0">
        <div class="col span-12">
          <MatchExpressions
            v-model="podSelectorExpressions"
            :mode="mode"
            :show-remove="false"
            :initial-empty-row="true"
            :type="POD"
          />
        </div>
      </div>
    </div>
    <div v-if="targetType === TARGET_OPTION_NAMESPACE_SELECTOR">
      <div class="row">
        <div class="col span-12">
          <Banner color="success">
            <span v-html="t('networkpolicy.selectors.matchingNamespaces.matchesSome', matchingNamespaces)" />
          </Banner>
        </div>
      </div>
      <div class="row mb-0">
        <div class="col span-12">
          <MatchExpressions
            v-model="namespaceSelectorExpressions"
            :mode="mode"
            :show-remove="false"
            :initial-empty-row="true"
            :type="POD"
          />
        </div>
      </div>
    </div>
  </div>
</template>
