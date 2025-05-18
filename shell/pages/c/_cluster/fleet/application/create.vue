<script>
import { FLEET } from '@shell/config/types';
import { SUB_TYPE } from '@shell/config/query-params';
import FleetUtils from '@shell/utils/fleet';
import Masthead from '@shell/components/ResourceDetail/Masthead';

export default {
  name: 'FleetApplicationCreatePage',

  components: { Masthead },

  data() {
    return {
      resource:    FLEET.APPLICATION,
      application: { parentNameOverride: this.$store.getters['i18n/t'](`typeLabel."${ FLEET.APPLICATION }"`, { count: 1 })?.trim() },
      abbrSizes:   {
        3: '24px',
        4: '18px',
        5: '16px',
        6: '14px'
      },
    };
  },

  computed: {
    types() {
      return [
        FLEET.GIT_REPO,
        FLEET.HELM_OP
      ].map((type) => {
        const schema = this.$store.getters['management/schemaFor'](type);

        const label = this.$store.getters['type-map/labelFor'](schema) || '';

        return {
          id:          type,
          label,
          description: `fleet.application.subTypes.'${ type }'.description`,
          icon:        FleetUtils.resourceIcons[type],
        };
      });
    },

    selectedSubtype() {
      return this.$route.query[SUB_TYPE];
    },
  },

  methods: {
    selectType(resource, event) {
      // TODO keyboard shortcuts
      if (event?.srcElement?.tagName === 'A') {
        return;
      }

      // this.$router.applyQuery({ [SUB_TYPE]: id });
      this.$router.push({
        name:   'c-cluster-fleet-application-resource-create',
        params: {
          cluster: this.$route.params.cluster,
          product: this.$store.getters['productId'],
          resource,
        },
      });
    },

    cancel() {
      this.$router.back();
      // this.$router.push({
      //   name:   'c-cluster-fleet-application',
      //   params: {
      //     cluster:  this.$route.params.cluster,
      //     product:  this.$store.getters['productId'],
      //     resource: FLEET.APPLICATION,
      //   },
      // });
    },
  }
};
</script>

<template>
  <div v-if="!selectedSubtype">
    <div class="header">
      <Masthead
        :resource="resource"
        :value="application"
      />
    </div>
    <div class="subtypes-container">
      <div
        v-for="(subtype, i) in types"
        :key="i"
        class="subtype-banner"
        :class="{ selected: subtype.id === selectedSubtype }"
        :data-testid="`subtype-banner-item-${subtype.id}`"
        tabindex="0"
        :aria-disabled="false"
        :aria-label="subtype.description ? `${subtype.label} - ${subtype.description}` : subtype.label"
        role="link"
        @click="selectType(subtype.id, $event)"
        @keyup.enter.space="selectType(subtype.id, $event)"
      >
        <slot name="subtype-content">
          <div class="subtype-container">
            <div class="subtype-logo">
              <img
                v-if="subtype.bannerImage"
                :src="subtype.bannerImage"
                :alt="(resource.type ? resource.type + ': ' : '') + (subtype.label || '')"
              >
              <div v-else-if="subtype.icon">
                <i
                  class="icon icon-image"
                  :class="subtype.icon"
                />
              </div>
              <div
                v-else
                class="round-image"
              >
                <div
                  v-if="subtype.bannerAbbrv"
                  class="banner-abbrv"
                >
                  <span v-if="$store.getters['i18n/exists'](subtype.bannerAbbrv)">{{ t(subtype.bannerAbbrv) }}</span>
                  <span
                    v-else
                    :style="{fontSize: abbrSizes[subtype.bannerAbbrv.length]}"
                  >{{ subtype.bannerAbbrv }}</span>
                </div>
                <div v-else>
                  {{ subtype.id.slice(0, 1).toUpperCase() }}
                </div>
              </div>
            </div>
            <div class="subtype-body">
              <div
                class="title"
                :class="{'with-description': !!subtype.description}"
              >
                <h5>
                  <span
                    v-if="$store.getters['i18n/exists'](subtype.label)"
                    v-clean-html="t(subtype.label)"
                  />
                  <span v-else>{{ subtype.label }}</span>
                </h5>
                <a
                  v-if="subtype.docLink"
                  :href="subtype.docLink"
                  target="_blank"
                  rel="noopener nofollow"
                  class="flex-right"
                >{{ t('generic.moreInfo') }} <i class="icon icon-external-link" /></a>
              </div>
              <hr v-if="subtype.description">
              <div
                v-if="subtype.description"
                class="description"
              >
                <span
                  v-if="$store.getters['i18n/exists'](subtype.description)"
                  v-clean-html="t(subtype.description, {}, true)"
                />
                <span v-else>{{ subtype.description }}</span>
              </div>
            </div>
          </div>
        </slot>
      </div>
    </div>
    <div class="footer">
      <button
        type="button"
        class="btn role-secondary"
        @click="cancel"
      >
        <t k="generic.cancel" />
      </button>
    </div>
  </div>
  <div v-else>
    empty
  </div>
</template>

<style lang='scss' scoped>

  $logo: 60px;
  $logo-space: 100px;

  .subtypes-container {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    flex-direction:row;
    align-content: baseline;
  }
  .subtype-content {
    width: 100%;
  }

  .subtype-banner {
    border: 1px solid var(--border);
    border-radius: 0;
    display: flex;
    flex-basis: 48%;
    margin: 10px;

    &.disabled {
      cursor: not-allowed !important;
      background-color: var(--disabled-bg);
    }

    &.selected {
      background-color: var(--accent-btn);
    }

    &.top {
      background-image: linear-gradient(
        -90deg,
        var(--body-bg),
        var(--accent-btn)
      );

      h2 {
        margin: 0px;
      }
    }

    .title {
      align-items: center;
      display: flex;
      width: 100%;

      h5 {
        margin: 0;
      }

      .flex-right {
        margin-left: auto;
      }
    }

    .description {
      color: var(--input-label);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    &:not(.top) {
      flex-direction: column;
      justify-content: start;
      &:hover {
        cursor: pointer;
        box-shadow: 0px 0px 1px var(--outline-width) var(--outline);
      }
    }

    .round-image {
      border-radius: 50%;
      height: 60px;
      width: 60px;
      overflow: hidden;
    }

    .banner-abbrv {
      align-items: center;
      background-color: var(--primary);
      color: var(--body-bg);
      display: flex;
      font-size: 2.5em;
      height: 100%;
      justify-content: center;
      width: 100%;
    }
  }

  .subtype-container {
    position: relative;
    display: flex;
    height: 100%;
  };

  .subtype-body {
    flex: 1;
    padding: 10px;
  }

  .subtype-logo {
    align-items: center;
    display: flex;
    justify-content: center;
    min-width: $logo-space;
    min-height: $logo-space;
    overflow: hidden;
    background-color: var(--box-bg);

    img {
      width: $logo - 4px;
      height: $logo - 4px;
      object-fit: contain;
      position: relative;
      top: 2px;
    }
  }

  .subtype-banner {
    .round-image {
      background-color: var(--primary);
    }

    &:focus-visible {
      @include focus-outline;
    }
  }

  .icon {
    font-size: 4.45em;
    line-height: 0.95em;
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    margin: 20px 10px 0 10px;
    z-index: 19;
  }
</style>
