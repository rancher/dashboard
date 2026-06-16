<script>
import throttle from 'lodash/throttle';
import CreateEditView from '@shell/mixins/create-edit-view';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import CruResource from '@shell/components/CruResource';
import { Banner } from '@components/Banner';
import Labels from '@shell/components/form/Labels';
import { POD } from '@shell/config/types';
import { convert, simplify } from '@shell/utils/selector';
import { matching } from '@shell/utils/selector-typed';

import { Checkbox } from '@components/Form/Checkbox';
import { addObject, removeObject } from '@shell/utils/array';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import PolicyRules from '@shell/edit/networking.k8s.io.networkpolicy/PolicyRules';
import ResourceTable from '@shell/components/ResourceTable';

const POLICY_TYPES = {
  INGRESS: 'Ingress',
  EGRESS:  'Egress',
};

export default {
  emits:        ['input'],
  // Props are found in CreateEditView
  // props: {},
  inheritAttrs: false,
  components:   {
    Banner,
    Checkbox,
    CruResource,
    Labels,
    MatchExpressions,
    NameNsDescription,
    PolicyRules,
    ResourceTable,
    Tab,
    Tabbed,
  },

  mixins: [CreateEditView],

  async fetch() {
    this.updateMatchingPods();
  },

  data() {
    return {
      POD,
      matchingPods: {
        matched: 0,
        matches: [],
        none:    true,
        sample:  null,
        total:   0,
      },
      podTableHeaders: this.$store.getters['type-map/headersFor'](
        this.$store.getters['cluster/schemaFor'](POD)
      ),
      inStore: this.$store.getters['currentProduct'].inStore,
    };
  },

  created() {
    if ( !this.value.spec ) {
      this.value['spec'] = {
        policyTypes: [],
        podSelector: {
          matchExpressions: [],
          matchLabels:      {},
        }
      };
    }
  },

  computed: {
    podSchema() {
      return this.$store.getters['cluster/schemaFor'](POD);
    },
    hasIngressPolicies: {
      get() {
        return this.value.spec.policyTypes.includes(POLICY_TYPES.INGRESS);
      },
      set(hasIngressPolicies) {
        let policyTypes = this.value.spec.policyTypes;

        if (hasIngressPolicies) {
          addObject(policyTypes, POLICY_TYPES.INGRESS);
          if (!this.value.spec.ingress) {
            this.value.spec['ingress'] = [];
          }
        } else {
          policyTypes = removeObject(policyTypes, POLICY_TYPES.INGRESS);
          delete this.value.spec['ingress'];
        }

        this.value.spec['policyTypes'] = policyTypes;
      }
    },
    hasEgressPolicies: {
      get() {
        return this.value.spec.policyTypes.includes(POLICY_TYPES.EGRESS);
      },
      set(hasEgressPolicies) {
        let policyTypes = this.value.spec.policyTypes;

        if (hasEgressPolicies) {
          addObject(policyTypes, POLICY_TYPES.EGRESS);
          if (!this.value.spec.egress) {
            this.value.spec['egress'] = [];
          }
        } else {
          policyTypes = removeObject(policyTypes, POLICY_TYPES.EGRESS);
          delete this.value.spec['egress'];
        }

        this.value.spec['policyTypes'] = policyTypes;
      }
    },
    /**
     * of type matchExpression aka `KubeLabelSelectorExpression[]`
     */
    podSelectorExpressions: {
      get() {
        return convert(
          this.value.spec.podSelector.matchLabels || {},
          this.value.spec.podSelector.matchExpressions || []
        );
      },
      set(podSelectorExpressions) {
        this.value.spec['podSelector'] = simplify(podSelectorExpressions);
      }
    },
  },

  watch: {
    'value.metadata.namespace': 'updateMatchingPods',
    'value.spec.podSelector':   'updateMatchingPods',
  },

  methods: {
    updateMatchingPods: throttle(async function() {
      this.matchingPods = await matching({
        labelSelector: { matchExpressions: this.podSelectorExpressions },
        type:          POD,
        $store:        this.$store,
        inStore:       this.inStore,
        namespace:     this.value.metadata.namespace,
        transient:     true,
      });
    }, 250, { leading: true }),
  },
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    @error="(e) => (errors = e)"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      v-if="!isView"
      :value="value"
      :mode="mode"
    />

    <div class="row mb-40">
      <div class="col span-12">
        <Tabbed
          :side-tabs="true"
          :use-hash="useTabbedHash"
          :default-tab="defaultTab"
        >
          <Tab
            name="ingress"
            label-key="networkpolicy.ingress.label"
            :show-header="false"
            :weight="3"
          >
            <h2 class="">
              {{ t('networkpolicy.ingress.label') }}
            </h2>
            <Checkbox
              v-model:value="hasIngressPolicies"
              class="mt-20 mb-10"
              :mode="mode"
              :label="t('networkpolicy.ingress.enable')"
              data-testid="network-policy-ingress-enable-checkbox"
            />
            <PolicyRules
              v-if="hasIngressPolicies"
              :value="value"
              type="ingress"
              :mode="mode"
              :use-tabbed-hash="useTabbedHash"
              @update:value="$emit('input', $event)"
            />
          </Tab>
          <Tab
            name="egress"
            label-key="networkpolicy.egress.label"
            :show-header="false"
            :weight="2"
          >
            <h2>
              {{ t('networkpolicy.egress.label') }}
            </h2>
            <Checkbox
              v-model:value="hasEgressPolicies"
              class="mt-20 mb-10"
              :mode="mode"
              :label="t('networkpolicy.egress.enable')"
            />
            <PolicyRules
              v-if="hasEgressPolicies"
              :value="value"
              type="egress"
              :mode="mode"

              @update:value="$emit('input', $event)"
            />
          </Tab>
          <Tab
            name="selectors"
            label-key="networkpolicy.selectors.label"
            :show-header="false"
            :weight="1"
          >
            <h2>
              {{ t('networkpolicy.selectors.label') }}
              <i
                v-clean-tooltip="t('networkpolicy.selectors.hint')"
                class="icon icon-info"
              />
            </h2>
            <div class="row">
              <div class="col span-12">
                <MatchExpressions
                  v-model:value="podSelectorExpressions"
                  :mode="mode"
                  :show-remove="false"
                  :type="POD"
                />
              </div>
            </div>
            <div class="row">
              <div class="col span-12">
                <Banner color="success">
                  <span v-clean-html="t('networkpolicy.selectors.matchingPods.matchesSome', matchingPods)" />
                </Banner>
              </div>
            </div>
            <div class="row">
              <div class="col span-12">
                <ResourceTable
                  :rows="matchingPods.matches"
                  :headers="podTableHeaders"
                  key-field="id"
                  :table-actions="false"
                  :schema="podSchema"
                  :groupable="false"
                  :search="false"
                />
              </div>
            </div>
          </Tab>
          <Tab
            name="labels-and-annotations"
            :label="t('networkpolicy.labelsAnnotations.label', {}, true)"
            :weight="-1"
          >
            <Labels
              :default-container-class="'labels-and-annotations-container'"
              :value="value"
              :mode="mode"
              :display-side-by-side="false"
            />
          </Tab>
        </Tabbed>
      </div>
    </div>
  </CruResource>
</template>
