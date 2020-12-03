<script>
import { KUBERNETES, PROJECT } from '@/config/labels-annotations';
import { FLEET, NAMESPACE, MANAGEMENT } from '@/config/types';
import ButtonGroup from '@/components/ButtonGroup';
import BadgeState from '@/components/BadgeState';
import Banner from '@/components/Banner';
import { get } from '@/utils/object';
import { NAME as FLEET_NAME } from '@/config/product/fleet';
import { HIDE_SENSITIVE } from '@/store/prefs';
import {
  AS, _DETAIL, _CONFIG, _YAML, MODE, _CREATE, _EDIT, _VIEW, _UNFLAG
} from '@/config/query-params';

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

    resourceSubtype: {
      type:    String,
      default: null,
    }
  },

  computed: {
    schema() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return this.$store.getters[`${ inStore }/schemaFor`]( this.value.type );
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
      if (this.value?.metadata?.state?.error) {
        const defaultErrorMessage = this.t('resourceDetail.masthead.defaultBannerMessage.error', undefined, true);

        return {
          color:   'error',
          message: this.value.metadata.state.message || defaultErrorMessage
        };
      }

      if (this.value?.metadata?.state?.transitioning) {
        const defaultTransitioningMessage = this.t('resourceDetail.masthead.defaultBannerMessage.transitioning', undefined, true);

        return {
          color:   'info',
          message: this.value.metadata.state.message || defaultTransitioningMessage
        };
      }

      return null;
    },

    parent() {
      const displayName = this.$store.getters['type-map/labelFor'](this.schema);
      const location = {
        name:   'c-cluster-product-resource',
        params: { resource: this.value.type }
      };

      const typeOptions = this.$store.getters[`type-map/optionsFor`]( this.value.type );
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

    isDetail() {
      return this.currentView === _DETAIL;
    },

    managedWarning() {
      const { value } = this;
      const labels = value?.metadata?.labels || {};

      const managedBy = labels[KUBERNETES.MANAGED_BY] || '';
      const appName = labels[KUBERNETES.MANAGED_NAME] || labels[KUBERNETES.INSTANCE] || '';

      return {
        show:    this.mode === _EDIT && managedBy.toLowerCase() === 'helm',
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
            <nuxt-link :to="parent.location">
              {{ parent.displayName }}:
            </nuxt-link>
            <t :k="'resourceDetail.header.' + realMode" :subtype="resourceSubtype" :name="value.nameDisplay" />
          </h1>
          <BadgeState v-if="!isCreate && parent.showState" :value="value" />
        </div>
        <div v-if="!isCreate" class="subheader">
          <span v-if="isNamespace && project">{{ t("resourceDetail.masthead.project") }}: {{ project.nameDisplay }}</span>
          <span v-else-if="isWorkspace">{{ t("resourceDetail.masthead.workspace") }}: <nuxt-link :to="workspaceLocation">{{ namespace }}</nuxt-link></span>
          <span v-else-if="namespace">{{ t("resourceDetail.masthead.namespace") }}: <nuxt-link :to="namespaceLocation">{{ namespace }}</nuxt-link></span>
          <span v-if="parent.showAge">{{ t("resourceDetail.masthead.age") }}: <LiveDate class="live-date" :value="get(value, 'metadata.creationTimestamp')" /></span>
        </div>
      </div>
      <slot name="right">
        <div v-if="isView" class="actions">
          <ButtonGroup
            v-if="isView && isDetail && !!value.hasSensitiveData"
            :labels-are-translations="true"
            :value="!!hideSensitiveData"
            icon-size="lg"
            :options="sensitiveOptions"
            @input="toggleSensitiveData"
          />

          <ButtonGroup
            v-if="viewOptions"
            v-model="currentView"
            :options="viewOptions"
          />

          <button
            ref="actions"
            aria-haspopup="true"
            type="button"
            class="btn btn-sm role-multi-action actions"
            @click="showActions"
          >
            <i class="icon icon-actions" />
          </button>
        </div>
      </slot>
    </header>

    <Banner v-if="banner && isView && !parent.hideBanner" class="state-banner mb-20" :color="banner.color" :label="banner.message" />
    <Banner
      v-if="managedWarning.show"
      color="warning"
      class="mb-20"
      :label="t('resourceDetail.masthead.managedWarning', managedWarning)"
    />
  </div>
</template>

<style lang='scss' scoped>
  .masthead {
  }

  .primaryheader {
    display: flex;
    flex-direction: row;
    align-items: center;

    h1 {
      margin-right: 8px;
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

  .actions {
    display: flex;
    justify-content: flex-end;
    align-items:center;
    & .btn-group {
      margin-right: 5px;
    }
  }

  .state-banner {
    margin: 3px 0 0 0;
  }

</style>
