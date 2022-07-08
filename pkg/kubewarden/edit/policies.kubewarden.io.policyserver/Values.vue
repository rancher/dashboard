<script>
import { _CREATE } from '@shell/config/query-params';

import Tabbed from '@shell/components/Tabbed';

export default {
  name: 'Values',

  props: {
    mode: {
      type:    String,
      default: _CREATE
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

  components: { Tabbed },

  async fetch() {
    try {
      await this.loadValuesComponent();
    } catch (e) {
      console.error(`Error loading values component: ${ e }`); // eslint-disable-line no-console
    }
  },

  data() {
    return {
      showQuestions:       true,
      showValuesComponent: false,
      valuesComponent:     null
    };
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    }
  },

  methods: {
    async loadValuesComponent() {
      if ( this.$store.getters['catalog/haveComponent']('kubewarden/policy-server') ) {
        this.valuesComponent = this.$store.getters['catalog/importComponent']('kubewarden/policy-server');
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
    <div class="scroll__container">
      <div class="scroll__content">
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
      </div>
    </div>
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
</style>
