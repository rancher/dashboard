<script>
import { mapGetters } from 'vuex';
import ChartMixin from '@/mixins/chart';
import {
  _CREATE, _VIEW, CHART, REPO, REPO_TYPE, VERSION
} from '@/config/query-params';
import { KUBEWARDEN } from '@/config/types';
import isEqual from 'lodash/isEqual';
import Wizard from '@/components/Wizard';
import Tabbed from '@/components/Tabbed';
import Questions from '@/components/Questions';

import questionJson from '@/.questions/questions.json';

export default ({
  name: 'Create',

  components: {
    Wizard, Tabbed, Questions
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

    this.errors = [];
  },

  watch: {
    '$route.query'(neu, old) {
      if ( !isEqual(neu, old) ) {
        this.$fetch();
      }
    },
  },

  data() {
    return {
      errors:        null,
      showQuestions: true,
      type:          null,
      chartValues:   null,
      subtypeSource: null,

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

  computed: {
    ...mapGetters(['currentCluster']),

    isView() {
      return this.mode === _VIEW;
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
            id:          type,
            description: `kubewarden.policyCharts.${ shortType }`,
            label:       shortType,
            bannerAbbrv: shortType.charAt(0)
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
    }
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
          <div
            class="subtypes-container"
          >
            <slot name="subtypes" :subtypes="subtypes">
              <div
                v-for="subtype in subtypes"
                :key="subtype.id"
                class="subtype-banner"
                :class="{ selected: subtype.id }"
                @click="selectType(subtype.id, $event)"
              >
                <slot name="subtype-content">
                  <div class="subtype-container">
                    <div class="subtype-logo">
                      <img
                        v-if="subtype.bannerImage"
                        :src="subtype.bannerImage"
                        :alt="(resource.type ? resource.type + ': ' : '') + (subtype.label || '')"
                      />
                      <div v-else class="round-image">
                        <div
                          v-if="subtype.bannerAbbrv"
                          class="banner-abbrv"
                        >
                          <span v-if="$store.getters['i18n/exists'](subtype.bannerAbbrv)">{{ t(subtype.bannerAbbrv) }}</span>
                          <span v-else :style="{fontSize: abbrSizes[subtype.bannerAbbrv.length]}">{{ subtype.bannerAbbrv }}</span>
                        </div>
                        <div v-else>
                          {{ subtype.id.slice(0, 1).toUpperCase() }}
                        </div>
                      </div>
                    </div>
                    <div class="subtype-body">
                      <div class="title" :class="{'with-description': !!subtype.description}">
                        <h5>
                          <span
                            v-if="$store.getters['i18n/exists'](subtype.label)"
                            v-html="t(subtype.label)"
                          ></span>
                          <span v-else>{{ subtype.label }}</span>
                        </h5>
                      </div>
                      <hr v-if="subtype.description" />
                      <div v-if="subtype.description" class="description">
                        <span
                          v-if="$store.getters['i18n/exists'](subtype.description)"
                          v-html="t(subtype.description, {}, true)"
                        ></span>
                        <span v-else>{{ subtype.description }}</span>
                      </div>
                    </div>
                  </div>
                </slot>
              </div>
            </slot>
          </div>
        </form>
      </template>

      <template #helmValues>
        <div class="step__values__controls">
          Edit form/yaml button group goes here
        </div>
        <div class="scroll__container">
          <div class="scroll__content">
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
          </div>
        </div>
      </template>
    </Wizard>
  </div>
</template>

<style lang="scss" scoped>
  $title-height: 50px;
  $padding: 5px;
  $slideout-width: 35%;
  $logo: 60px;

  .wizard {
    .logo-bg {
      height: $title-height;
      width: $title-height;
      background-color: white;
      border: $padding solid white;
      border-radius: calc( 3 * var(--border-radius));
      position: relative;
    }

    .logo {
      max-height: $title-height - 2 * $padding;
      max-width: $title-height - 2 * $padding;
      position: absolute;
      width: auto;
      height: auto;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      margin: auto;
    }

  }

  ::v-deep .step-container {
      height: auto;
    }

  .step {
    &__basic {
      display: flex;
      flex-direction: column;
      flex: 1;

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

  .subtype-banner {
    .round-image {
      background-color: var(--primary);
    }
  }

  .title {
    margin-top: 20px;

    &.with-description {
      margin-top: 0;
    }
  }

  .subtype-container {
    position: relative;
  };

  .subtype-body {
    margin-left: $logo + 10px;
  }

  .subtype-logo {
    align-items: center;
    display: flex;
    justify-content: center;
    position: absolute;
    left: 0;
    width: $logo;
    height: $logo;
    border-radius: calc(2 * var(--border-radius));
    overflow: hidden;
    background-color: white;

    > .round-image {
      margin-right: 0;
    };

    img {
      width: $logo - 4px;
      height: $logo - 4px;
      object-fit: contain;
      position: relative;
      top: 2px;
    }
  }
</style>
