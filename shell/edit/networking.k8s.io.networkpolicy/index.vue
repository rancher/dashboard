<script>
import throttle from 'lodash/throttle';
import CreateEditView from '@shell/mixins/create-edit-view';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import CruResource from '@shell/components/CruResource';
import { Banner } from '@components/Banner';
import Labels from '@shell/components/form/Labels';
import { NAMESPACE, POD } from '@shell/config/types';
import { convert, matching, simplify } from '@shell/utils/selector';
import { Checkbox } from '@components/Form/Checkbox';
import { addObject, removeObject } from '@shell/utils/array';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import PolicyRules from '@shell/edit/networking.k8s.io.networkpolicy/PolicyRules';
import ResourceTable from '@shell/components/ResourceTable';
import { allHash } from '@shell/utils/promise';

const POLICY_TYPES = {
  INGRESS: 'Ingress',
  EGRESS:  'Egress',
};

export default {
  // Props are found in CreateEditView
  // props: {},

  components: {
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
    const hash = await allHash({
      allPods:       this.$store.dispatch('cluster/findAll', { type: POD }),
      allNamespaces: this.$store.dispatch('cluster/findAll', { type: NAMESPACE }),
    });

    this.allPods = hash.allPods;
    this.allNamespaces = hash.allNamespaces;

    this.updateMatchingPods();
  },

  data() {
    if ( !this.value.spec ) {
      this.$set(this.value, 'spec', {
        policyTypes: [],
        podSelector: {
          matchExpressions: [],
          matchLabels:      {},
        }
      });
    }

    const matchingPods = {
      matched: 0,
      matches: [],
      none:    true,
      sample:  null,
      total:   0,
    };

    return {
      POD,
      matchingPods,
      allPods:         [],
      allNamespaces:   [],
      podTableHeaders: this.$store.getters['type-map/headersFor'](
        this.$store.getters['cluster/schemaFor'](POD)
      ),
    };
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
            this.$set(this.value.spec, 'ingress', []);
          }
        } else {
          policyTypes = removeObject(policyTypes, POLICY_TYPES.INGRESS);
          this.$delete(this.value.spec, 'ingress');
        }

        this.$set(this.value.spec, 'policyTypes', policyTypes);
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
            this.$set(this.value.spec, 'egress', []);
          }
        } else {
          policyTypes = removeObject(policyTypes, POLICY_TYPES.EGRESS);
          this.$delete(this.value.spec, 'egress');
        }

        this.$set(this.value.spec, 'policyTypes', policyTypes);
      }
    },
    podSelectorExpressions: {
      get() {
        return convert(
          this.value.spec.podSelector.matchLabels || {},
          this.value.spec.podSelector.matchExpressions || []
        );
      },
      set(podSelectorExpressions) {
        this.$set(this.value.spec, 'podSelector', simplify(podSelectorExpressions));
      }
    },
  },

  watch: {
    'value.metadata.namespace': 'updateMatchingPods',
    'value.spec.podSelector':   'updateMatchingPods',
  },

  methods: {
    updateMatchingPods: throttle(function() {
      const allInNamespace = this.allPods.filter(pod => pod.metadata.namespace === this.value.metadata.namespace);
      const match = matching(allInNamespace, this.podSelectorExpressions);
      const matched = match.length || 0;
      const sample = match[0]?.nameDisplay;

      this.matchingPods = {
        matched,
        matches: match,
        none:    matched === 0,
        sample,
        total:   allInNamespace.length,
      };
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
        <Tabbed :side-tabs="true">
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
              v-model="hasIngressPolicies"
              class="mt-20 mb-10"
              :mode="mode"
              :label="t('networkpolicy.ingress.enable')"
            />
            <PolicyRules
              v-if="hasIngressPolicies"
              v-model="value"
              type="ingress"
              :mode="mode"
              :all-namespaces="allNamespaces"
              :all-pods="allPods"
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
              v-model="hasEgressPolicies"
              class="mt-20 mb-10"
              :mode="mode"
              :label="t('networkpolicy.egress.enable')"
            />
            <PolicyRules
              v-if="hasEgressPolicies"
              v-model="value"
              type="egress"
              :mode="mode"
              :all-namespaces="allNamespaces"
              :all-pods="allPods"
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
                v-tooltip="t('networkpolicy.selectors.hint')"
                class="icon icon-info"
              />
            </h2>
            <div class="row">
              <div class="col span-12">
                <MatchExpressions
                  v-model="podSelectorExpressions"
                  :mode="mode"
                  :show-remove="false"
                  :type="POD"
                />
              </div>
            </div>
            <div class="row">
              <div class="col span-12">
                <Banner color="success">
                  <span v-html="t('networkpolicy.selectors.matchingPods.matchesSome', matchingPods)" />
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
