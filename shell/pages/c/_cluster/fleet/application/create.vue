<script>
import { FLEET } from '@shell/config/types';
import { SUB_TYPE } from '@shell/config/query-params';
import { APPCO, APPCO_REGISTRY } from '@shell/models/fleet-application';
import FleetUtils from '@shell/utils/fleet';
import Masthead from '@shell/components/ResourceDetail/Masthead';

export default {
  name: 'FleetApplicationCreatePage',

  components: { Masthead },

  async fetch() {
    await this.$store.dispatch('catalog/load', { root: true });
  },

  data() {
    return {
      APPCO,
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
    appCoRegistry() {
      const registries = this.$store.getters['catalog/repos'] || [];

      return registries.find((repo) => repo.spec?.url === APPCO_REGISTRY);
    },

    types() {
      const out = [
        FLEET.GIT_REPO,
        FLEET.HELM_OP
      ].reduce((acc, type) => {
        const schema = this.$store.getters['management/schemaFor'](type);

        if (schema) {
          const label = this.$store.getters['type-map/labelFor'](schema, 2) || '';

          const canCreate = !!schema.resourceMethods?.includes('PUT');

          return [
            ...acc,
            {
              id:          type,
              label,
              description: `fleet.application.subTypes.'${ type }'.description`,
              icon:        FleetUtils.dashboardIcons[type],
              disabled:    !canCreate,
              tooltip:     canCreate ? null : this.t('fleet.application.noPermissions', { label }, true),
            }
          ];
        }

        return acc;
      }, []);

      if (this.appCoRegistry) {
        const isActive = this.appCoRegistry?.state === 'active';

        out.push({
          id:          APPCO,
          label:       'Application Collection',
          description: `fleet.application.subTypes.'${ APPCO }'.description`,
          disabled:    !isActive,
          tooltip:     isActive ? null : this.t('fleet.application.appco.registry.error'),
        });
      }

      return out;
    },

    selectedSubtype() {
      return this.$route.query[SUB_TYPE];
    },
  },

  methods: {
    selectType(subtype, event) {
      if (subtype.disabled) {
        return;
      }

      if (event?.srcElement?.tagName === 'A') {
        return;
      }

      if (subtype.id === APPCO) {
        this.$router.push({
          name:   'c-cluster-fleet-application-resource-create-appco',
          params: {
            cluster:  this.$route.params.cluster,
            product:  this.$store.getters['productId'],
            resource: FLEET.HELM_OP,
          },
        });
      } else {
        this.$router.push({
          name:   'c-cluster-fleet-application-resource-create',
          params: {
            cluster:  this.$route.params.cluster,
            product:  this.$store.getters['productId'],
            resource: subtype.id,
          },
        });
      }
    },

    cancel() {
      this.$router.back();
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
        v-clean-tooltip="subtype.tooltip"
        class="subtype-banner"
        tabindex="0"
        role="link"
        :class="{
          selected: subtype.id === selectedSubtype,
          disabled: subtype.disabled
        }"
        :data-testid="`subtype-banner-item-${subtype.id}`"
        :aria-disabled="false"
        :aria-label="subtype.description ? `${subtype.label} - ${subtype.description}` : subtype.label"
        @click="selectType(subtype, $event)"
        @keyup.enter.space="selectType(subtype, $event)"
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
              <div v-else-if="subtype.id === APPCO">
                <svg
                  data-v-053d0174=""
                  class="appco-logo"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  x="0px"
                  y="0px"
                  viewBox="0 0 100 100"
                  xml:space="preserve"
                ><title data-v-053d0174="">Local Cluster icon</title> <g data-v-053d0174=""><g data-v-053d0174=""><path
                  data-v-053d0174=""
                  class="appco-fill"
                  d="M26.0862026,44.4953918H8.6165142c-5.5818157,0-9.3979139-4.6252708-8.4802637-10.1311035l2.858391-17.210701
            C3.912292,11.6477556,6.1382647,7.1128125,7.8419709,7.1128125s3.1788611,4.5368752,3.1788611,10.1186218v4.4837742
            c0,5.5817471,4.4044495,9.5409164,9.9862652,9.5409164h5.0791054V44.4953918z"
                /></g> <path
                  data-v-053d0174=""
                  class="appco-fill"
                  d="M63.0214729,92.8871841H37.0862045c-6.0751343,0-11.0000019-4.9248657-11.0000019-11V30.3864384
          c0-6.0751324,4.9248676-11,11.0000019-11h25.9352684c6.0751305,0,11.0000038,4.9248676,11.0000038,11v51.5007477
          C74.0214767,87.9623184,69.0966034,92.8871841,63.0214729,92.8871841z"
                /> <g data-v-053d0174=""><path
                  data-v-053d0174=""
                  class="appco-fill"
                  d="M73.9137955,44.4953918h17.4696884c5.5818176,0,9.3979187-4.6252708,8.4802628-10.1311035
            l-2.8583908-17.210701c-0.9176483-5.5058317-3.1436234-10.0407753-4.8473282-10.0407753
            s-3.1788635,4.5368752-3.1788635,10.1186218v4.4837742c0,5.5817471-4.4044418,9.5409164-9.9862595,9.5409164h-5.0791092
            V44.4953918z"
                /></g></g></svg>
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
    justify-content: space-between;
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
    margin: auto 10px 0 10px;
    z-index: 19;
  }

  .appco-logo {
    width: 50px;
  }

  .appco-fill {
    fill: white
  }
</style>
