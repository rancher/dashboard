<script>
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { SCHEMA } from '@shell/config/types';
import { createYaml } from '@shell/utils/create-yaml';
import { clone } from '@shell/utils/object';

import ButtonGroup from '@shell/components/ButtonGroup';
import ResourceCancelModal from '@shell/components/ResourceCancelModal';
import Tabbed from '@shell/components/Tabbed';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';

const VALUES_STATE = {
  FORM: 'FORM',
  YAML: 'YAML',
};

const YAML_OPTIONS = [
  {
    labelKey: 'catalog.install.section.chartOptions',
    value:    VALUES_STATE.FORM,
  },
  {
    labelKey: 'catalog.install.section.valuesYaml',
    value:    VALUES_STATE.YAML,
  }
];

export default {
  name: 'Values',

  props: {
    mode: {
      type:     String,
      default:  _VIEW
    },
    chartValues: {
      type:     Object,
      required: true
    },
    value: {
      type:     Object,
      required: true
    }
  },

  components: {
    ButtonGroup, ResourceCancelModal, Tabbed, YamlEditor
  },

  async fetch() {
    try {
      this.version = this.$store.getters['catalog/version']({
        repoType:      'cluster',
        repoName:      'kubewarden',
        chartName:     'kubewarden-controller',
      });

      await this.loadValuesComponent();
    } catch (e) {
      console.error(`Unable to fetch Version: ${ e }`); // eslint-disable-line no-console
    }

    this.generateYaml();
  },

  data() {
    return {
      YAML_OPTIONS,
      originalYamlValues:  null,
      showQuestions:       true,
      showValuesComponent: false,
      valuesComponent:     null,
      preYamlOption:       VALUES_STATE.FORM,
      yamlOption:          VALUES_STATE.FORM,
    };
  },

  watch: {
    yamlOption(neu, old) {
      switch (neu) {
      case VALUES_STATE.FORM:
        this.showQuestions = true;

        break;
      case VALUES_STATE.YAML:
        this.showQuestions = false;

        break;
      }
    },
  },

  computed: {
    editorMode() {
      return EDITOR_MODES.EDIT_CODE;
    },

    isCreate() {
      return this.mode === _CREATE;
    }
  },

  methods: {
    generateYaml() {
      const inStore = this.$store.getters['currentStore'](this.value);
      const schemas = this.$store.getters[`${ inStore }/all`](SCHEMA);
      const cloned = this.chartValues?.policy ? clone(this.chartValues.policy) : this.value;

      this.yamlValues = createYaml(schemas, this.value.type, cloned);
    },

    async loadValuesComponent() {
      if ( this.$store.getters['catalog/haveComponent']('kubewarden/admission') ) {
        this.valuesComponent = this.$store.getters['catalog/importComponent']('kubewarden/admission');
        await this.valuesComponent();

        this.showValuesComponent = true;
      }
    },

    tabChanged() {
      window.scrollTop = 0;
    },
  }
};
</script>

<template>
  <div>
    <div v-if="isCreate" class="step__values__controls">
      <ButtonGroup
        v-model="yamlOption"
        :options="YAML_OPTIONS"
        inactive-class="bg-disabled btn-sm"
        active-class="bg-primary btn-sm"
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
            <component
              :is="valuesComponent"
              v-model="chartValues"
              :mode="mode"
            />
          </Tabbed>
        </template>
        <template v-else-if="isCreate && !showQuestions">
          <YamlEditor
            ref="yaml"
            v-model="yamlValues"
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
  </div>
</template>

<style lang="scss" scoped>
  $padding: 5px;

  .step {
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
</style>
