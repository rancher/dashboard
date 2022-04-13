<script>
import { KUBERNETES, PROJECT } from '@shell/config/labels-annotations';
import { FLEET, NAMESPACE, MANAGEMENT } from '@shell/config/types';
import ButtonGroup from '@shell/components/ButtonGroup';
import BadgeState from '@shell/components/BadgeState';
import Banner from '@shell/components/Banner';
import { get } from '@shell/utils/object';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet';
import { HIDE_SENSITIVE } from '@shell/store/prefs';
import {
  AS, _DETAIL, _CONFIG, _YAML, MODE, _CREATE, _EDIT, _VIEW, _UNFLAG
} from '@shell/config/query-params';

export default {
  components: {
    BadgeState, Banner, ButtonGroup
  },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    mode: {
      type:    String,
      default: 'create'
    },

    realMode: {
      type:    String,
      default: 'create'
    },

    as: {
      type:    String,
      default: _YAML,
    },

    hasDetail: {
      type:    Boolean,
      default: false
    },

    hasEdit: {
      type:    Boolean,
      default: false
    },

    storeOverride: {
      type:    String,
      default: null,
    },

    resource: {
      type:    String,
      default: null,
    },

    resourceSubtype: {
      type:    String,
      default: null,
    },

    parentRouteOverride: {
      type:    String,
      default: null,
    },
  },

  computed: {
    schema() {
      const inStore = this.storeOverride || this.$store.getters['currentStore'](this.resource);

      return this.$store.getters[`${ inStore }/schemaFor`]( this.resource );
    },

    isView() {
      return this.mode === _VIEW;
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    isNamespace() {
      return this.schema?.id === NAMESPACE;
    },

    namespace() {
      if (this.value?.metadata?.namespace) {
        return this.value?.metadata?.namespace;
      }

      return null;
    },

    shouldHifenize() {
      return (this.mode === 'view' || this.mode === 'edit') && this.resourceSubtype?.length && this.value?.nameDisplay?.length;
    },

    namespaceLocation() {
      if (!this.isNamespace) {
        return {
          name:   'c-cluster-product-resource-id',
          params: {
            cluster:  this.$route.params.cluster,
            product:  this.$store.getters['productId'],
            resource: NAMESPACE,
            id:       this.$route.params.namespace
          }
        };
      }

      return null;
    },

    isWorkspace() {
      return this.$store.getters['productId'] === FLEET_NAME && !!this.value?.metadata?.namespace;
    },

    workspaceLocation() {
      return {
        name:   'c-cluster-product-resource-id',
        params: {
          cluster:  this.$route.params.cluster,
          product:  this.$store.getters['productId'],
          resource: FLEET.WORKSPACE,
          id:       this.$route.params.namespace
        }
      };
    },

    project() {
      if (this.isNamespace) {
        const id = (this.value?.metadata?.labels || {})[PROJECT];
        const clusterId = this.$store.getters['currentCluster'].id;

        return this.$store.getters['management/byId'](MANAGEMENT.PROJECT, `${ clusterId }/${ id }`);
      } else {
        return null;
      }
    },

    banner() {
      if (this.value?.stateObj?.error) {
        const defaultErrorMessage = this.t('resourceDetail.masthead.defaultBannerMessage.error', undefined, true);

        return {
          color:   'error',
          message: this.value.stateObj.message || defaultErrorMessage
        };
      }

      if (this.value?.spec?.paused) {
        return {
          color:   'info',
          message: this.t('asyncButton.pause.description')
        };
      }

      if (this.value?.stateObj?.transitioning) {
        const defaultTransitioningMessage = this.t('resourceDetail.masthead.defaultBannerMessage.transitioning', undefined, true);

        return {
          color:   'info',
          message: this.value.stateObj.message || defaultTransitioningMessage
        };
      }

      return null;
    },

    parent() {
      const displayName = this.value.parentNameOverride || this.$store.getters['type-map/labelFor'](this.schema);
      const product = this.$store.getters['currentProduct'].name;

      const defaultLocation = {
        name:   'c-cluster-product-resource',
        params: {
          resource: this.resource,
          product,
        }
      };

      const location = this.value?.parentLocationOverride || defaultLocation;

      if (this.parentRouteOverride) {
        location.name = this.parentRouteOverride;
      }

      const typeOptions = this.$store.getters[`type-map/optionsFor`]( this.resource );
      const out = {
        displayName, location, ...typeOptions
      };

      return out;
    },

    hideSensitiveData() {
      return this.$store.getters['prefs/get'](HIDE_SENSITIVE);
    },

    sensitiveOptions() {
      return [
        {
          tooltipKey: 'resourceDetail.masthead.sensitive.hide',
          icon:       'icon-hide',
          value:      true,
        },
        {
          tooltipKey: 'resourceDetail.masthead.sensitive.show',
          icon:       'icon-show',
          value:      false
        }
      ];
    },

    viewOptions() {
      const out = [];

      if ( this.hasDetail ) {
        out.push({
          labelKey: 'resourceDetail.masthead.detail',
          value:    'detail',
        });
      }

      if ( this.hasEdit ) {
        out.push({
          labelKey: 'resourceDetail.masthead.config',
          value:    'config',
        });
      }

      if ( !out.length ) {
        // If there's only YAML, return nothing and the button group will be hidden entirely
        return null;
      }

      out.push({
        labelKey: 'resourceDetail.masthead.yaml',
        value:    'yaml',
      });

      return out;
    },

    currentView: {
      get() {
        return this.as;
      },

      set(val) {
        switch ( val ) {
        case _DETAIL:
          this.$router.applyQuery({
            [MODE]: _UNFLAG,
            [AS]:   _UNFLAG,
          });
          break;
        case _CONFIG:
          this.$router.applyQuery({
            [MODE]: _UNFLAG,
            [AS]:   _CONFIG,
          });
          break;
        case 'yaml':
          this.$router.applyQuery({
            [MODE]: _UNFLAG,
            [AS]:   _YAML,
          });
          break;
        }
      },
    },

    showSensitiveToggle() {
      return !!this.value.hasSensitiveData && this.mode === _VIEW && this.as !== _YAML;
    },

    managedWarning() {
      const { value } = this;
      const labels = value?.metadata?.labels || {};

      const managedBy = labels[KUBERNETES.MANAGED_BY] || '';
      const appName = labels[KUBERNETES.MANAGED_NAME] || labels[KUBERNETES.INSTANCE] || '';

      return {
        show:    this.mode === _EDIT && !!managedBy,
        type:    value?.kind || '',
        hasName: appName ? 'yes' : 'no',
        appName,
        managedBy,
      };
    },
  },

  methods: {
    get,

    showActions() {
      this.$store.commit('action-menu/show', {
        resources: this.value,
        elem:      this.$refs.actions,
      });
    },

    toggleSensitiveData(e) {
      this.$store.dispatch('prefs/set', { key: HIDE_SENSITIVE, value: !!e });
    }
  }
};
</script>

<template>
  <div class="masthead">
    <header>
      <div class="title">
        <div class="primaryheader">
          <h1>
            <nuxt-link v-if="parent.location" :to="parent.location">
              {{ parent.displayName }}:
            </nuxt-link>
            <span v-else>{{ parent.displayName }}:</span>
            <span v-if="value.detailPageHeaderActionOverride && value.detailPageHeaderActionOverride(realMode)">{{ value.detailPageHeaderActionOverride(realMode) }}</span>
            <t v-else :k="'resourceDetail.header.' + realMode" :subtype="resourceSubtype" :name="shouldHifenize ? ` - ${ value.nameDisplay }` : value.nameDisplay" />
            <BadgeState v-if="!isCreate && parent.showState" class="masthead-state" :value="value" />
          </h1>
        </div>
        <div v-if="!isCreate" class="subheader">
          <span v-if="isNamespace && project">{{ t("resourceDetail.masthead.project") }}: {{ project.nameDisplay }}</span>
          <span v-else-if="isWorkspace">{{ t("resourceDetail.masthead.workspace") }}: <nuxt-link :to="workspaceLocation">{{ namespace }}</nuxt-link></span>
          <span v-else-if="namespace">{{ t("resourceDetail.masthead.namespace") }}: <nuxt-link :to="namespaceLocation">{{ namespace }}</nuxt-link></span>
          <span v-if="parent.showAge">{{ t("resourceDetail.masthead.age") }}: <LiveDate class="live-date" :value="get(value, 'metadata.creationTimestamp')" /></span>
        </div>
      </div>
      <slot name="right">
        <div class="actions-container">
          <div class="actions">
            <ButtonGroup
              v-if="showSensitiveToggle"
              :value="!!hideSensitiveData"
              icon-size="lg"
              :options="sensitiveOptions"
              @input="toggleSensitiveData"
            />

            <ButtonGroup
              v-if="viewOptions && isView"
              v-model="currentView"
              :options="viewOptions"
            />

            <button
              v-if="isView"
              ref="actions"
              aria-haspopup="true"
              type="button"
              class="btn role-multi-action actions"
              @click="showActions"
            >
              <i class="icon icon-actions" />
            </button>
          </div>
        </div>
      </slot>
    </header>

    <Banner v-if="banner && isView && !parent.hideBanner" class="state-banner mb-10" :color="banner.color" :label="banner.message" />
    <Banner
      v-if="managedWarning.show"
      color="warning"
      class="mb-20"
      :label="t('resourceDetail.masthead.managedWarning', managedWarning)"
    />

    <slot />
  </div>
</template>

<style lang='scss' scoped>
  .masthead {
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 10px;
  }

  HEADER {
    margin: 0;
  }

  .primaryheader {
    display: flex;
    flex-direction: row;
    align-items: center;

    h1 {
      margin: 0;
    }
  }

  .subheader{
    display: flex;
    flex-direction: row;
    color: var(--input-label);
    & > * {
      margin: 5px 20px 5px 0px;
    }

    .live-date {
      color: var(--body-text)
    }
  }

  .state-banner {
    margin: 3px 0 0 0;
  }

  .masthead-state {
    font-size: initial;
    display: inline-block;
    position: relative;
    top: -2px;
  }

  .left-right-split {
    display: grid;
    align-items: center;

    .left-half {
      grid-column: 1;
    }

    .right-half {
      grid-column: 2;
    }
  }

</style>
