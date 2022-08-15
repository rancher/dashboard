<script>
import jsyaml from 'js-yaml';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import isEmpty from 'lodash/isEmpty';
import { NAMESPACE_SELECTOR } from '../../plugins/kubewarden/policy-class';
import ChartMixin from '@shell/mixins/chart';
import CreateEditView from '@shell/mixins/create-edit-view';
import { _CREATE, CHART, REPO, REPO_TYPE } from '@shell/config/query-params';
import { KUBEWARDEN } from '../../types';
import { saferDump } from '@shell/utils/create-yaml';
import { set } from '@shell/utils/object';

import Loading from '@shell/components/Loading';
import Wizard from '@shell/components/Wizard';

import PolicyGrid from './PolicyGrid';
import Values from './Values';

export default ({
  name: 'Create',

  components: {
    Loading,
    Wizard,
    PolicyGrid,
    Values
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:     Object,
      required: true
    },
  },

  mixins: [ChartMixin, CreateEditView],

  async fetch() {
    this.errors = [];

    this.repository = await this.value.artifactHubRepo();

    if ( this.repository ) {
      const promises = this.repository.map(pkg => this.packageDetails(pkg));

      this.packages = await Promise.all(promises);
    }

    if ( !this.chartValues ) {
      try {
        // Without importing this here the object would maintain the state
        this.questions = await import(/* webpackChunkName: "questions-data" */ '../../questions/questions.json');

        const _questions = cloneDeep(JSON.parse(JSON.stringify(this.questions)));

        // This object will need to be refactored when helm charts exist for policies
        this.chartValues = { questions: _questions };
      } catch (e) {
        console.error(`Error importing questions ${ e }`); // eslint-disable-line no-console
      }
    }

    const defaultPolicy = require(`../../questions/policies/defaultPolicy.json`);

    this.yamlValues = saferDump(defaultPolicy);

    this.value.apiVersion = `${ this.schema?.attributes?.group }.${ this.schema?.attributes?.version }`;
    this.value.kind = this.schema?.attributes?.kind;
  },

  data() {
    return {
      errors:            null,
      packages:          null,
      questions:         null,
      repository:        null,
      splitType:         null,
      type:              null,
      typeModule:        null,
      version:           null,

      chartValues:       null,
      yamlValues:        null,

      hasCustomRegistry: false,

      // Steps
      stepPolicies: {
        hidden: false,
        name:   'policies',
        label:  'Policies',
        ready:  false,
        weight: 99
      },
      stepValues: {
        name:   'values',
        label:  'Values',
        ready:  true,
        weight: 98
      },
    };
  },

  watch: {
    hasCustomRegistry(neu, old) {
      if ( !old ) {
        this.policyQuestions(neu);
      }
    }
  },

  computed: {
    isCreate() {
      return this.realMode === _CREATE;
    },

    isSelected() {
      return !!this.type;
    },

    steps() {
      const steps = [];

      steps.push(
        this.stepPolicies,
        this.stepValues
      );

      return steps.sort((a, b) => b.weight - a.weight);
    },

    subtypes() {
      const out = [];
      const { SPOOFED } = KUBEWARDEN;

      for ( const key in SPOOFED ) {
        const type = SPOOFED[key];

        if ( type !== SPOOFED.POLICIES && type !== SPOOFED.POLICY ) {
          const shortType = type.replace(`${ SPOOFED.POLICIES }.`, '');
          const resourceType = this.t(`kubewarden.policyCharts.${ shortType }.resourceType`);

          const subtype = {
            key, // unnecessary with artifacthub
            resourceType, // have this `package.data.['kubewarden/resources']`
            id:           type, // unnecessary with artifacthub
            label:        this.t(`kubewarden.policyCharts.${ shortType }.name`), // have this
            description:  this.t(`kubewarden.policyCharts.${ shortType }.description`), // have this
            keywords:     this.t(`kubewarden.policyCharts.${ shortType }.keywords`).split('\n').slice(0, -1) // need to fetch package details for this
          };

          out.push(subtype);
        }
      }

      return out;
    }
  },

  methods: {
    done() {
      this.$router.replace({
        name:   'c-cluster-product-resource',
        params: {
          cluster:  this.$route.params.cluster,
          product:  'kubewarden',
          resource: this.schema?.id
        }
      });
    },

    async finish(event) {
      try {
        // This won't be necessary if we can get the policy to automatically apply a default value for this property
        if ( isEmpty(this.chartValues?.policy?.spec?.rules[0]?.apiGroups) ) {
          this.chartValues.policy.spec.rules[0].apiGroups.push('');
        }

        const { ignoreRancherNamespaces } = this.chartValues.policy;

        if ( ignoreRancherNamespaces ) {
          set(this.chartValues.policy.spec, 'namespaceSelector', { matchExpressions: [NAMESPACE_SELECTOR] });
          delete this.chartValues.policy.ignoreRancherNamespaces;
        }

        const out = this.chartValues?.policy ? this.chartValues.policy : jsyaml.load(this.yamlValues);

        merge(this.value, out);

        await this.save(event);
      } catch (e) {
        this.errors.push(e);
      }
    },

    async packageDetails(pkg) {
      try {
        return await this.value.artifactHubPackage(pkg);
      } catch (e) {}
    },

    policyQuestions(isCustom) {
      const shortType = !!isCustom ? 'defaultPolicy' : this.type?.replace(`${ KUBEWARDEN.SPOOFED.POLICIES }.`, '');
      const match = require(`../../questions/policies/${ shortType }.json`);

      if ( match ) {
        set(this.chartValues, 'policy', match);
      }

      // Spoofing the questions object from hard-typed questions json for each policy
      if ( match?.spec?.settings && !isEmpty(match.spec.settings) ) {
        const questionsMatch = require(`../../questions/policy-questions/${ shortType }.json`);

        if ( questionsMatch ) {
          set(this.chartValues.questions, 'questions', questionsMatch);
        }
      }
    },

    reset() {
      this.$nextTick(() => {
        const initialState = [
          'errors',
          'splitType',
          'type',
          'typeModule',
          'chartValues.policy',
          'yamlValues'
        ];

        initialState.forEach((i) => {
          this[i] = null;
        });
      });
    },

    selectType(type) {
      this.type = type;

      if ( type === 'custom' ) {
        this.$set(this, 'hasCustomRegistry', true);

        this.stepPolicies.ready = true;
        this.$refs.wizard.next();

        return;
      }

      this.$router.push({
        query: {
          [REPO]:      'kubewarden',
          [REPO_TYPE]: 'cluster',
          [CHART]:     type.replace(`${ KUBEWARDEN.SPOOFED.POLICIES }.`, ''),
        },
      });

      this.policyQuestions();
      this.stepPolicies.ready = true;
      this.$refs.wizard.next();
      this.splitType = type.split('policies.kubewarden.io.policies.')[1];
      this.typeModule = this.chartValues.policy.spec.module;
    }
  }

});
</script>

<template>
  <Loading v-if="$fetchState.pending" mode="relative" />
  <div v-else>
    <Wizard
      v-if="value"
      ref="wizard"
      v-model="value"
      :errors="errors"
      :steps="steps"
      :edit-first-step="true"
      :banner-title="splitType"
      :banner-title-subtext="typeModule"
      class="wizard"
      @back="reset"
      @cancel="done"
      @finish="finish"
    >
      <template #policies>
        <PolicyGrid :value="subtypes" @selectType="selectType($event)">
          <template #customSubtype>
            <div class="subtype" @click="selectType('custom')">
              <div class="subtype__metadata">
                <div class="subtype__badge" :style="{ 'background-color': 'var(--darker)' }">
                  <label>{{ t('kubewarden.customPolicy.badge') }}</label>
                </div>

                <h4 class="subtype__label">
                  {{ t('kubewarden.customPolicy.title') }}
                </h4>

                <div class="subtype__description">
                  {{ t('kubewarden.customPolicy.description') }}
                </div>
              </div>
            </div>
          </template>
        </PolicyGrid>
      </template>

      <template #values>
        <Values :value="value" :chart-values="chartValues" :mode="mode" />
      </template>
    </Wizard>
  </div>
</template>

<style lang="scss" scoped>
$padding: 5px;
$height: 110px;
$margin: 10px;
$color: var(--body-text) !important;

::v-deep .step-container {
  height: auto;
}

::v-deep .subtype {
  height: $height;
  margin: $margin;
  position: relative;
  border-radius: calc( 1.5 * var(--border-radius));
  border: 1px solid var(--border);
  text-decoration: none !important;
  color: $color;

  &:hover:not(.disabled) {
    box-shadow: 0 0 30px var(--shadow);
    transition: box-shadow 0.1s ease-in-out;
    cursor: pointer;
    text-decoration: none !important;
  }

  &__metadata {
    padding: $margin;

    &__label, &__description {
      padding-right: 20px;
    }
  }

  &__badge {
    position: absolute;
    right: 0;
    top: 0;
    padding: 2px $padding;
    border-bottom-left-radius: var(--border-radius);

    label {
      font-size: 12px;
      line-height: 12px;
      text-align: center;
      display: block;
      white-space: no-wrap;
      text-overflow: ellipsis;
      color: var(--app-rancher-accent-text);
      margin: 0;
    }
  }

  &__label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
    line-height: initial;
  }

  &__description {
    margin-right: $margin;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--input-label);
  }
}
</style>
