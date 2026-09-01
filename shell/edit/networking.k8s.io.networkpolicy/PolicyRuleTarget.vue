<script>

import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _EDIT } from '@shell/config/query-params';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import { convert, simplify } from '@shell/utils/selector';
import { NAMESPACE, POD } from '@shell/config/types';
import ArrayList from '@shell/components/form/ArrayList';
import { Banner } from '@components/Banner';
import debounce from 'lodash/debounce';
import { isValidCIDR } from '@shell/utils/validators/cidr';
import { matching } from '@shell/utils/selector-typed';

const TARGET_OPTIONS = {
  IP_BLOCK:                   'ipBlock',
  NAMESPACE_SELECTOR:         'namespaceSelector',
  POD_SELECTOR:               'podSelector',
  NAMESPACE_AND_POD_SELECTOR: 'namespaceAndPodSelector',
};

// Components shown for Network Policy --> Ingress/Egress Rules --> Rule Type are...
// Edit Network Policy --> `PolicyRules` 1 --> M `PolicyRule` 1 --> M `PolicyRuleTarget`

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
  },
  data() {
    return {
      portOptions:  ['TCP', 'UDP'],
      matchingPods: {
        matches: [], matched: 0, total: 0
      },
      matchingNamespaces: {
        matches: [], matched: 0, total: 0
      },
      invalidCidr:            null,
      invalidCidrs:           [],
      POD,
      TARGET_OPTIONS,
      targetOptions:          Object.values(TARGET_OPTIONS),
      inStore:                this.$store.getters['currentProduct'].inStore,
      debouncedUpdateMatches: debounce(this.updateMatches, 500)
    };
  },
  created() {
    if (!this.value[TARGET_OPTIONS.IP_BLOCK] &&
      !this.value[TARGET_OPTIONS.POD_SELECTOR] &&
      !this.value[TARGET_OPTIONS.NAMESPACE_SELECTOR] &&
      !this.value[TARGET_OPTIONS.NAMESPACE_AND_POD_SELECTOR]
    ) {
      this.$nextTick(() => {
        this.value[TARGET_OPTIONS.IP_BLOCK] = {};
      });
    }
  },
  computed: {
    /**
     * of type matchExpression aka `KubeLabelSelectorExpression[]`
     */
    podSelectorExpressions: {
      get() {
        return convert(
          this.value[TARGET_OPTIONS.POD_SELECTOR]?.matchLabels || {},
          this.value[TARGET_OPTIONS.POD_SELECTOR]?.matchExpressions || []
        );
      },
      set(podSelectorExpressions) {
        this.value[TARGET_OPTIONS.POD_SELECTOR] = simplify(podSelectorExpressions);
      }
    },
    /**
     * of type matchExpression aka `KubeLabelSelectorExpression[]`
     */
    namespaceSelectorExpressions: {
      get() {
        return convert(
          this.value[TARGET_OPTIONS.NAMESPACE_SELECTOR]?.matchLabels || {},
          this.value[TARGET_OPTIONS.NAMESPACE_SELECTOR]?.matchExpressions || []
        );
      },
      set(namespaceSelectorExpressions) {
        this.value[TARGET_OPTIONS.NAMESPACE_SELECTOR] = simplify(namespaceSelectorExpressions);
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
          if (this.value[TARGET_OPTIONS.NAMESPACE_AND_POD_SELECTOR] || (this.value[TARGET_OPTIONS.NAMESPACE_SELECTOR] && this.value[TARGET_OPTIONS.POD_SELECTOR])) {
            return TARGET_OPTIONS.NAMESPACE_AND_POD_SELECTOR;
          }
          if (this.value[option]) {
            return option;
          }
        }

        return null;
      },
      set(targetType) {
        delete this.value[TARGET_OPTIONS.IP_BLOCK];
        delete this.value[TARGET_OPTIONS.NAMESPACE_SELECTOR];
        delete this.value[TARGET_OPTIONS.POD_SELECTOR];
        delete this.value[TARGET_OPTIONS.NAMESPACE_AND_POD_SELECTOR];
        this.$nextTick(() => {
          this.value[targetType] = {};
        });
      }
    },
    matchingNamespacesAndPods() {
      return {
        policyNamespace: this.namespace,
        ...Object.keys(this.matchingNamespaces).reduce((acc, k) => ({ ...acc, [`${ k }Namespaces`]: this.matchingNamespaces[k] }), {}),
        ...Object.keys(this.matchingPods).reduce((acc, k) => ({ ...acc, [`${ k }Pods`]: this.matchingPods[k] }), {}),
      };
    }
  },
  watch: {
    namespace: {
      handler() {
        this.debouncedUpdateMatches();
      },
      immediate: true
    },
    'value.podSelector': {
      handler() {
        this.debouncedUpdateMatches();
      },
      immediate: true
    },
    'value.namespaceSelector': {
      handler() {
        this.debouncedUpdateMatches();
      },
      immediate: true
    },
    'value.ipBlock.cidr':   'validateCIDR',
    'value.ipBlock.except': 'validateCIDR',
    podSelectorExpressions: {
      handler() {
        this.debouncedUpdateMatches();
      },
      immediate: true
    },
    namespaceSelectorExpressions: {
      handler() {
        this.debouncedUpdateMatches();
      },
      immediate: true
    }
  },

  fetch() {
    this.debouncedUpdateMatches();
  },

  methods: {
    async updateMatches() {
      // Note - needs to be sequential as getMatchingPods requires matchingNamespaces to be up-to-date
      this.matchingNamespaces = await this.getMatchingNamespaces();
      this.matchingPods = await this.getMatchingPods();
    },

    validateCIDR() {
      const exceptCidrs = this.value[TARGET_OPTIONS.IP_BLOCK]?.except || [];

      this.invalidCidrs = exceptCidrs
        .filter((cidr) => !isValidCIDR(cidr))
        .map((invalidCidr) => invalidCidr || '<blank>');

      if (this.value[TARGET_OPTIONS.IP_BLOCK]?.cidr && !isValidCIDR(this.value[TARGET_OPTIONS.IP_BLOCK].cidr)) {
        this.invalidCidr = this.value[TARGET_OPTIONS.IP_BLOCK].cidr;
      } else {
        this.invalidCidr = null;
      }
    },

    async getMatchingPods() {
      return await matching({
        labelSelector: { matchExpressions: this.podSelectorExpressions },
        type:          POD,
        $store:        this.$store,
        inStore:       this.inStore,
        namespace:     this.targetType === TARGET_OPTIONS.NAMESPACE_AND_POD_SELECTOR ? this.matchingNamespaces.matches.map((ns) => ns.id) : this.namespace,
        transient:     true,
      });
    },
    async getMatchingNamespaces() {
      return await matching({
        labelSelector: { matchExpressions: this.namespaceSelectorExpressions },
        type:          NAMESPACE,
        $store:        this.$store,
        inStore:       this.inStore,
        transient:     true,
      });
    },
  }
};
</script>

<template>
  <div class="rule">
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="targetType"
          data-testid="policy-rule-target-type-labeled-select"
          :mode="mode"
          :tooltip="targetType === TARGET_OPTIONS.NAMESPACE_AND_POD_SELECTOR ? t('networkpolicy.selectors.matchingNamespacesAndPods.tooltip') : null"
          :options="selectTargetOptions"
          :multiple="false"
          :label="t('networkpolicy.rules.type')"
        />
      </div>
    </div>
    <div v-if="targetType === TARGET_OPTIONS.IP_BLOCK">
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value[TARGET_OPTIONS.IP_BLOCK].cidr"
            data-testid="labeled-input-ip-block-selector"
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
            v-model:value="value[TARGET_OPTIONS.IP_BLOCK].except"
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
    <div v-if="targetType === TARGET_OPTIONS.POD_SELECTOR">
      <div class="row">
        <div class="col span-12">
          <Banner color="success">
            <span v-clean-html="t('networkpolicy.selectors.matchingPods.matchesSome', matchingPods)" />
          </Banner>
        </div>
      </div>
      <div class="row mb-0">
        <div class="col span-12">
          <MatchExpressions
            v-model:value="podSelectorExpressions"
            data-testid="match-expression-pod-selector"
            :mode="mode"
            :show-remove="false"
            :initial-empty-row="true"
            :type="POD"
          />
        </div>
      </div>
    </div>
    <div v-if="targetType === TARGET_OPTIONS.NAMESPACE_SELECTOR">
      <div class="row">
        <div class="col span-12">
          <Banner color="success">
            <span
              v-clean-html="t('networkpolicy.selectors.matchingNamespaces.matchesSome', matchingNamespaces)"
              data-testid="matching-namespaces-message"
            />
          </Banner>
        </div>
      </div>
      <div class="row mb-0">
        <div class="col span-12">
          <MatchExpressions
            v-model:value="namespaceSelectorExpressions"
            data-testid="match-expression-namespace-selector"
            :mode="mode"
            :show-remove="false"
            :initial-empty-row="true"
            :type="POD"
          />
        </div>
      </div>
    </div>
    <div v-if="targetType === TARGET_OPTIONS.NAMESPACE_AND_POD_SELECTOR">
      <div class="row">
        <div class="col span-12">
          <Banner color="success">
            <span
              v-if="!namespaceSelectorExpressions.length"
              v-clean-html="t('networkpolicy.selectors.matchingPods.matchesSome', matchingPods)"
            />
            <span
              v-else
              v-clean-html="t('networkpolicy.selectors.matchingNamespacesAndPods.matchesSome', matchingNamespacesAndPods)"
            />
          </Banner>
        </div>
      </div>
      <div class="row mb-0">
        <div class="col span-1 namespace-pod-rule">
          <span class="label">
            {{ t('networkpolicy.rules.namespace') }}
          </span>
        </div>
        <div class="col span-11">
          <MatchExpressions
            v-model:value="namespaceSelectorExpressions"
            data-testid="match-expression-namespace-and-pod-selector-ns-rule"
            :mode="mode"
            :show-add-button="false"
            :show-remove-button="false"
            :show-remove="false"
            :initial-empty-row="true"
            :type="POD"
          />
        </div>
      </div>
      <div class="row mb-0">
        <div class="col span-1 namespace-pod-rule">
          <span class="label">
            {{ t('networkpolicy.rules.pod') }}
          </span>
        </div>
        <div class="col span-11">
          <MatchExpressions
            v-model:value="podSelectorExpressions"
            data-testid="match-expression-namespace-and-pod-selector-pod-rule"
            :mode="mode"
            :show-add-button="false"
            :show-remove-button="false"
            :show-remove="false"
            :initial-empty-row="true"
            :type="POD"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped>
  .namespace-pod-rule {
    display: table;
    width: 100px;
    padding: 0, 10px, 0, 0;
    text-align: center;

    .label {
      display:table-cell;
      vertical-align:middle;
    }
  }
</style>
