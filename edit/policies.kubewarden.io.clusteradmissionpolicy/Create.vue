<script>
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import { mapGetters } from 'vuex';
import ChartMixin from '@/mixins/chart';
import CreateEditView from '@/mixins/create-edit-view';
import {
  CATEGORY, _CREATE, _VIEW, CHART, REPO, REPO_TYPE, SEARCH_QUERY, VERSION
} from '@/config/query-params';
import { KUBEWARDEN } from '@/config/types';
import { saferDump } from '@/utils/create-yaml';
import { ensureRegex } from '@/utils/string';
import { sortBy } from '@/utils/sort';

import ButtonGroup from '@/components/ButtonGroup';
import LabeledSelect from '@/components/form/LabeledSelect';
import Questions from '@/components/Questions';
import ResourceCancelModal from '@/components/ResourceCancelModal';
import Select from '@/components/form/Select';
import Tabbed from '@/components/Tabbed';
import Wizard from '@/components/Wizard';
import YamlEditor, { EDITOR_MODES } from '@/components/YamlEditor';

import defaultPolicy from '@/.questions/defaultPolicy.json';
import questionJson from '@/.questions/questions.json';

const VALUES_STATE = {
  FORM: 'FORM',
  YAML: 'YAML',
};

const DEFAULT_STATE = {
  chartValues:         null,
  type:                null,
  originalYamlValues:  null,
  previousYamlValues:  null,
  valuesYaml:          null,
  preYamlOption:      VALUES_STATE.YAML,
  yamlOption:         VALUES_STATE.YAML,
};

export default ({
  name: 'Create',

  components: {
    ButtonGroup, LabeledSelect, Questions, ResourceCancelModal, Select, Tabbed, Wizard, YamlEditor
  },

  props: {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:    String,
      default: _CREATE
    }
  },

  mixins: [ChartMixin, CreateEditView],

  fetch() {
    // await this.fetchChart(); // Use this when we get helm-charts for policies

    const query = this.$route.query;

    this.errors = [];

    try {
      this.version = this.$store.getters['catalog/version']({
        repoType:      'cluster',
        repoName:      'kubewarden',
        chartName:     'kubewarden-controller',
      });
    } catch (e) {
      console.error(`Unable to fetch Version: ${ e }`); // eslint-disable-line no-console
      this.errors.push(e);
    }

    if ( this.type ) {
      this.chartValues = {
        readme:      '# kubewarden readme example',
        appReadme:   '# kubewarden appReadme example',
        chart:       {},
        questions:   questionJson,
        values:      {}
      };
    }

    this.chartValues = merge(merge({}, this.versionInfo?.values || {}), defaultPolicy);
    this.valuesYaml = saferDump(this.chartValues);

    this.searchQuery = query[SEARCH_QUERY] || '';
    this.category = query[CATEGORY] || '';
  },

  data() {
    return {
      errors:              null,
      category:            null,
      keywords:            [],
      returned:            false,
      searchQuery:         null,
      type:                null,
      version:             null,

      chartValues:         null,
      valuesYaml:          null,
      originalYamlValues:  null,
      previousYamlValues:  null,
      preYamlOption:       VALUES_STATE.YAML,
      yamlOption:          VALUES_STATE.YAML,
      showQuestions:       this.isSelected,

      stepBasic:     {
        name:   'basics',
        label:  'Policies',
        ready:  true,
        weight: 30
      },
      stepValues: {
        name:   'helmValues',
        label:  'Values',
        ready:  true,
        weight: 20
      },

      categories: [
        {
          label: 'All',
          value: ''
        },
        {
          label: '*',
          value: 'Global'
        },
        {
          label: 'Ingress',
          value: 'Ingress'
        },
        {
          label: 'Pod',
          value: 'Pod'
        },
        {
          label: 'Service',
          value: 'Service'
        }
      ],

      yamlOptions: [
        {
          labelKey: 'catalog.install.section.chartOptions',
          value:    VALUES_STATE.FORM,
        },
        {
          labelKey: 'catalog.install.section.valuesYaml',
          value:    VALUES_STATE.YAML,
        }
      ]
    };
  },

  watch: {
    category(option) {
      this.$router.applyQuery({ [CATEGORY]: option || undefined });
    },

    searchQuery(query) {
      this.$router.applyQuery({ [SEARCH_QUERY]: query || undefined });
    },

    yamlOption(neu, old) {
      switch (neu) {
      case VALUES_STATE.FORM:
        // Return to form, reset everything back to starting point
        this.showQuestions = true;

        break;
      case VALUES_STATE.YAML:
        // Show the YAML preview
        if ( old === VALUES_STATE.FORM ) {
          this.valuesYaml = saferDump(this.chartValues || {});
        }

        this.showQuestions = false;

        break;
      }
    },
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({ t: 'i18n/t' }),

    isView() {
      return this.mode === _VIEW;
    },

    isSelected() {
      return !!this.type;
    },

    editorMode() {
      return EDITOR_MODES.EDIT_CODE;
    },

    filteredSubtypes() {
      const subtypes = (this.subtypes || []);

      const out = subtypes.filter((subtype) => {
        if ( this.category && !subtype.resourceType.includes(this.category) ) {
          return false;
        }

        if ( this.searchQuery ) {
          const searchTokens = this.searchQuery.split(/\s*[, ]\s*/).map(x => ensureRegex(x, false));

          for ( const token of searchTokens ) {
            if ( !subtype.label.match(token) && (subtype.description && !subtype.description.match(token)) ) {
              return false;
            }
          }
        }

        if ( this.keywords ) {
          for ( const selected of this.keywords ) {
            if ( !subtype.keywords.includes(selected) ) {
              return false;
            }
          }
        }

        return true;
      });

      return sortBy(out, ['category', 'label', 'description']);
    },

    keywordOptions() {
      const flattened = this.subtypes.flatMap((subtype) => {
        return subtype.keywords;
      });

      return [...new Set(flattened)];
    },

    showingYaml() {
      return this.yamlOption === VALUES_STATE.YAML;
    },

    steps() {
      const steps = [];

      steps.push(
        this.stepBasic,
        this.stepValues
      );

      return steps.sort((a, b) => ( b.weight || 0 ) - ( a.weight || 0 ));
    },

    subtypes() {
      const out = [];
      const { SPOOFED } = KUBEWARDEN;

      for ( const key in SPOOFED ) {
        const type = SPOOFED[key];

        if ( type !== SPOOFED.POLICIES && type !== SPOOFED.POLICY ) {
          const shortType = type.replace(`${ SPOOFED.POLICIES }.`, '');

          const subtype = {
            key,
            id:           type,
            label:        this.t(`kubewarden.policyCharts.${ shortType }.name`),
            description:  this.t(`kubewarden.policyCharts.${ shortType }.description`),
            resourceType: this.t(`kubewarden.policyCharts.${ shortType }.resourceType`),
            keywords:     this.t(`kubewarden.policyCharts.${ shortType }.keywords`).split('\n').slice(0, -1)
          };

          out.push(subtype);
        }
      }

      return out;
    },

    targetNamespace() {
      if ( this.forceNamespace ) {
        return this.forceNamespace;
      } else if ( this.value?.metadata.namespace ) {
        return this.value.metadata.namespace;
      }

      return 'default';
    },
  },

  methods: {
    selectType(type) {
      this.type = type;

      const chartType = type.replace(`${ KUBEWARDEN.SPOOFED.POLICIES }.`, '');

      this.$router.push({
        query: {
          [REPO]:      'kubewarden',
          [REPO_TYPE]: 'cluster',
          [CHART]:     chartType,
          [VERSION]:   'v0.1.4'
        }
      });

      this.$refs.wizard.next();
    },

    tabChanged() {
      window.scrollTop = 0;
    },

    back() {
      this.returned = true;

      // Reset the values of the state
      for ( const [key, value] of Object.entries(DEFAULT_STATE) ) {
        this[key] = value;
      }
    },

    cancel() {
      this.done();
    },

    done() {
      this.$router.replace({
        name:   'c-cluster-product-resource',
        params: {
          cluster:  this.$route.params.cluster,
          product:  'kubewarden',
          resource: KUBEWARDEN.CLUSTER_ADMISSION_POLICY
        }
      });
    },

    async finish() {
      try {
        const out = jsyaml.load(this.valuesYaml);

        merge(this.value, out);

        await this.save();
      } catch (e) {
        console.error(`Error when saving: ${ e }`); // eslint-disable-line no-console
        this.errors.push(e);
      }
    },

    next() {
      if ( !!this.type && !this.returned ) {
        this.yamlOption = VALUES_STATE.YAML;
      }
    },

    refresh() {
      this.category = null;
      this.keywords = [];
    },
  }

});
</script>

<template>
  <div>
    <Wizard
      v-if="value"
      ref="wizard"
      v-model="value"
      :errors="errors"
      :steps="steps"
      :edit-first-step="true"
      class="wizard"
      @next="next"
      @back="back"
      @cancel="cancel"
      @finish="finish"
    >
      <template #basics>
        <form
          :is="(isView? 'div' : 'form')"
          class="create-resource-container step__basic"
          @next="next"
        >
          <div class="filter">
            <LabeledSelect
              v-model="keywords"
              :clearable="true"
              :taggable="true"
              :mode="mode"
              :multiple="true"
              class="filter__keywords"
              label="Filter by Keyword"
              :options="keywordOptions"
              :disabled="isView"
            />

            <Select
              v-model="category"
              :clearable="true"
              :searchable="false"
              :options="categories"
              placement="bottom"
              class="filter__category"
              label="label"
              style="min-width: 200px;"
              :reduce="opt => opt.value"
            >
              <template #option="opt">
                {{ opt.label }}
              </template>
            </Select>

            <input
              ref="searchQuery"
              v-model="searchQuery"
              type="search"
              class="input-sm filter__search"
              :placeholder="t('catalog.charts.search')"
            >

            <button
              ref="btn"
              class="btn, btn-sm, role-primary"
              type="button"
              @click="refresh"
            >
              <i class="icon, icon-lg, icon-refresh" />
            </button>
          </div>

          <div class="grid">
            <div
              v-for="subtype in filteredSubtypes"
              :key="subtype.id"
              class="subtype"
              @click="selectType(subtype.id, $event)"
            >
              <div class="subtype__icon">
                <img v-if="subtype.icon" :src="subtype.icon" class="icon" />
                <i v-else class="icon icon-apps"></i>
              </div>

              <div class="subtype__metadata">
                <div class="subtype__badge">
                  <label>{{ subtype.resourceType }}</label>
                </div>

                <h4 class="subtype__label">
                  {{ subtype.label }}
                </h4>

                <div v-if="subtype.description" class="subtype__description">
                  {{ subtype.description }}
                </div>
              </div>
            </div>
          </div>
        </form>
      </template>

      <template #helmValues>
        <div class="step__values__controls">
          <ButtonGroup
            v-model="preYamlOption"
            :options="yamlOptions"
            inactive-class="bg-disabled btn-sm"
            active-class="bg-primary btn-sm"
            :disabled="preYamlOption != yamlOption"
          ></ButtonGroup>
        </div>
        <div class="scroll__container">
          <div class="scroll__content">
            <template v-if="showQuestions">
              <Tabbed
                ref="tabs"
                :side-tabs="true"
                class="step__values__content"
                @changed="tabChanged($event)"
              >
                <Questions
                  v-if="chartValues"
                  v-model="chartValues"
                  :mode="mode"
                  :source="chartValues"
                  tabbed="multiple"
                  :target-namespace="targetNamespace"
                />
              </Tabbed>
            </template>
            <template v-else>
              <YamlEditor
                ref="yaml"
                v-model="valuesYaml"
                class="step__values__content"
                :scrolling="true"
                :initial-yaml-values="originalYamlValues"
                :editor-mode="editorMode"
                :hide-preview-buttons="true"
              />
            </template>

            <ResourceCancelModal
              ref="cancelModal"
              :is-cancel-modal="false"
              :is-form="true"
              @cancel-cancel="preYamlOption = yamlOption"
              @confirm-cancel="yamlOption = preYamlOption"
            />
          </div>
        </div>
      </template>
    </Wizard>
  </div>
</template>

<style lang="scss" scoped>
  $padding: 5px;
  $height: 110px;
  $side: 15px;
  $margin: 10px;
  $logo: 60px;

  ::v-deep .step-container {
      height: auto;
    }

  .step {
    &__basic {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow-x: hidden;

      .spacer {
        line-height: 2;
      }
    }

    &__values {
      &__controls {
        display: flex;
        margin-bottom: 15px;

        & > *:not(:last-of-type) {
          margin-right: $padding * 2;
        }

        &--spacer {
          flex: 1
        }

      }

      &__content {
        flex: 1;

        ::v-deep .tab-container {
          overflow: auto;
        }
      }
    }
  }

  .filter {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-self: flex-end;

    & > * {
      margin: $margin;
    }
    & > *:first-child {
      margin-left: 0;
    }
    & > *:last-child {
      margin-right: 0;
    }
  }

  @media only screen and (min-width: map-get($breakpoints, '--viewport-4')) {
    .filter {
      width: 100%;
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-12')) {
    .filter {
      width: 75%;
    }
  }

  .grid {
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    margin: 0 -1*$margin;

    @media only screen and (min-width: map-get($breakpoints, '--viewport-4')) {
      .subtype {
        width: 100%;
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
      .subtype {
        width: calc(50% - 2 * #{$margin});
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-9')) {
      .subtype {
        width: calc(33.33333% - 2 * #{$margin});
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-12')) {
      .subtype {
        width: calc(25% - 2 * #{$margin});
      }
    }

    $color: var(--body-text) !important;

    .subtype {
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
        margin-left: $side+$logo+$margin;
        padding: $margin;
      }

      &__badge {
        position: absolute;
        padding: 2px 5px;
        background-color: var(--app-rancher-accent);
        border-radius: calc( 1.5 * var(--border-radius));

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

      &__icon {
        text-align: center;
        position: absolute;
        width: 85px;
        height: 100%;
        overflow: hidden;
        background-color: var(--simple-box-border);
        display: flex;
        justify-content: center;
        align-items: center;

        img, i {
          width: $logo;
          height: $logo;
          background: #fff;
          border-radius: 50%;
          object-fit: contain;
          display: flex;
          justify-content: center;
          align-items: center;
        }
      }

      &__label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 20px;
        margin-bottom: 0;
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

    .disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
</style>
