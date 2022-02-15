<script>
import jsyaml from 'js-yaml';
import isEqual from 'lodash/isEqual';
import { mapGetters } from 'vuex';
import ChartMixin from '@/mixins/chart';
import {
  _CREATE, _VIEW, CHART, REPO, REPO_TYPE, VERSION
} from '@/config/query-params';
import { KUBEWARDEN } from '@/config/types';
import { saferDump } from '@/utils/create-yaml';
import ButtonGroup from '@/components/ButtonGroup';
import Wizard from '@/components/Wizard';
import Tabbed from '@/components/Tabbed';
import ResourceCancelModal from '@/components/ResourceCancelModal';
import Questions from '@/components/Questions';
import YamlEditor, { EDITOR_MODES } from '@/components/YamlEditor';

import questionJson from '@/.questions/questions.json';

const VALUES_STATE = {
  FORM: 'FORM',
  YAML: 'YAML',
};

export default ({
  name: 'Create',

  components: {
    ButtonGroup, Wizard, Tabbed, ResourceCancelModal, Questions, YamlEditor
  },

  props: {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:    String,
      default: _CREATE
    },
    schema: {
      type:     Object,
      required: true
    }
  },

  mixins: [ChartMixin],

  fetch() {
    // await this.fetchChart(); // Use this when we get the helm-charts for policies

    if ( this.type ) {
      this.subtypeSource = {
        readme:      '# kubewarden readme example',
        appReadme:   '# kubewarden appReadme example',
        chart:       {},
        questions:   questionJson,
        values:      {}
      };
    }

    this.valuesYaml = saferDump(this.subtypeSource);
    this.preFormYamlOption = this.valuesComponent ? VALUES_STATE.FORM : VALUES_STATE.YAML;

    this.errors = [];
  },

  data() {
    return {
      errors:              null,
      showQuestions:       true,
      type:                null,
      // chartValues:         null, // not necessary until we get charts...
      subtypeSource:       null,
      originalYamlValues:  null,
      previousYamlValues:  null,
      valuesComponent:     null,
      valuesYaml:          '',

      preFormYamlOption:   VALUES_STATE.YAML,
      formYamlOption:      VALUES_STATE.YAML,
      showValuesComponent: true,

      abbrSizes:     {
        3: '24px',
        4: '18px',
        5: '16px',
        6: '14px'
      },

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
      }
    };
  },

  watch: {
    '$route.query'(neu, old) {
      if ( !isEqual(neu, old) ) {
        this.$fetch();
      }
    },

    preFormYamlOption(neu, old) {
      if ( neu === VALUES_STATE.FORM && this.valuesYaml !== this.previousYamlValues && !!this.$refs.cancelModal ) {
        this.$refs.cancelModal.show();
      } else {
        this.formYamlOption = neu;
      }
    },

    formYamlOption(neu, old) {
      switch (neu) {
      case VALUES_STATE.FORM:
        // Return to form, reset everything back to starting point
        this.valuesYaml = this.previousYamlValues;

        this.showValuesComponent = true;
        this.showQuestions = true;

        break;
      case VALUES_STATE.YAML:
        // Show the YAML preview
        if (old === VALUES_STATE.FORM) {
          this.valuesYaml = jsyaml.dump(this.subtypeSource || {}); // this will need to dump `this.chartValues` once we get charts...
          this.previousYamlValues = this.valuesYaml;
        }

        this.showValuesComponent = false;
        this.showQuestions = false;

        break;
      }
    },
  },

  mounted() {
    this.loadValuesComponent();

    this.preFormYamlOption = this.valuesComponent ? VALUES_STATE.FORM : VALUES_STATE.YAML;
  },

  computed: {
    ...mapGetters(['currentCluster']),

    isView() {
      return this.mode === _VIEW;
    },

    editorMode() {
      return EDITOR_MODES.EDIT_CODE;
    },

    formYamlOptions() {
      const options = [];

      if ( this.valuesComponent ) {
        options.push({
          labelKey: 'catalog.install.section.chartOptions',
          value:    VALUES_STATE.FORM,
        });
      }
      options.push({
        labelKey: 'catalog.install.section.valuesYaml',
        value:    VALUES_STATE.YAML,
      });

      return options;
    },

    showingYaml() {
      return this.formYamlOption === VALUES_STATE.YAML || ( !this.valuesComponent );
    },

    steps() {
      const steps = [];

      steps.push(
        this.stepBasic,
        this.stepValues
      );

      return steps.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    },

    subtypes() {
      const out = [];
      const { SPOOFED } = KUBEWARDEN;

      for (const key in SPOOFED) {
        const type = SPOOFED[key];

        if ( type !== SPOOFED.POLICIES && type !== SPOOFED.POLICY ) {
          const shortType = type.replace(`${ SPOOFED.POLICIES }.`, '');

          const subtype = {
            key,
            id:           type,
            label:        this.t(`kubewarden.policyCharts.${ shortType }.name`),
            description:  this.t(`kubewarden.policyCharts.${ shortType }.description`),
            resourceType: this.t(`kubewarden.policyCharts.${ shortType }.resourceType`)
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
    loadValuesComponent() {
      const path = 'edit/policies.kubewarden.io.clusteradmissionpolicy/Create.vue';

      this.valuesComponent = this.$store.getters['type-map/importComponent'](path);
      this.showValuesComponent = true;
    },

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

    cancel() {
      this.done();
    },

    done() {
      this.$router.replace(this.appLocation());
    },
  }

});
</script>

<template>
  <div>
    <Wizard
      v-if="value"
      ref="wizard"
      :errors="errors"
      :steps="steps"
      :edit-first-step="true"
      class="wizard"
    >
      <template #basics>
        <form :is="(isView? 'div' : 'form')" class="create-resource-container step__basic">
          <div class="grid">
            <div
              v-for="subtype in subtypes"
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
            v-model="preFormYamlOption"
            :options="formYamlOptions"
            inactive-class="bg-disabled btn-sm"
            active-class="bg-primary btn-sm"
            :disabled="preFormYamlOption != formYamlOption"
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
                  v-if="subtypeSource"
                  v-model="value"
                  :mode="mode"
                  :source="subtypeSource"
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
              @cancel-cancel="preFormYamlOption = formYamlOption"
              @confirm-cancel="formYamlOption = preFormYamlOption"
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
