<script>
import { KUBERNETES, PROJECT } from '@shell/config/labels-annotations';
import { FLEET, NAMESPACE, MANAGEMENT, HELM } from '@shell/config/types';
import ButtonGroup from '@shell/components/ButtonGroup';
import { BadgeState } from '@components/BadgeState';
import { Banner } from '@components/Banner';
import { get } from '@shell/utils/object';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet';
import { HIDE_SENSITIVE } from '@shell/store/prefs';
import {
  AS, _DETAIL, _CONFIG, _YAML, MODE, _CREATE, _EDIT, _VIEW, _UNFLAG, _GRAPH
} from '@shell/config/query-params';
import { ExtensionPoint, PanelLocation } from '@shell/core/types';
import ExtensionPanel from '@shell/components/ExtensionPanel';
import TabTitle from '@shell/components/TabTitle';

// i18n-uses resourceDetail.header.*

/**
 * Resource Detail Masthead component.
 *
 * ToDo: this component seem to be picking up a lot of logic from special cases, could be simplified down to parameters and then customized per use-case via wrapper component
 */
export default {

  name: 'MastheadResourceDetail',

  components: {
    BadgeState, Banner, ButtonGroup, ExtensionPanel, TabTitle
  },
  props: {
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

    hasGraph: {
      type:    Boolean,
      default: false
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

    canViewYaml: {
      type:    Boolean,
      default: false,
    }
  },

  data() {
    return {
      DETAIL_VIEW:       _DETAIL,
      extensionType:     ExtensionPoint.PANEL,
      extensionLocation: PanelLocation.DETAILS_MASTHEAD,
    };
  },

  computed: {
    dev() {
      return this.$store.getters['prefs/dev'];
    },

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

    isProject() {
      return this.schema?.id === MANAGEMENT.PROJECT;
    },

    isProjectHelmChart() {
      return this.schema?.id === HELM.PROJECTHELMCHART;
    },

    hasMultipleNamespaces() {
      return !!this.value.namespaces;
    },

    namespace() {
      if (this.value?.metadata?.namespace) {
        return this.value?.metadata?.namespace;
      }

      return null;
    },

    detailsAction() {
      return this.value?.detailsAction;
    },

    shouldHifenize() {
      return (this.mode === 'view' || this.mode === 'edit') && this.resourceSubtype?.length && this.value?.nameDisplay?.length;
    },

    namespaceLocation() {
      if (!this.isNamespace) {
        return this.value.namespaceLocation || {
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
        const cluster = this.$store.getters['currentCluster'];

        if (cluster) {
          const id = (this.value?.metadata?.labels || {})[PROJECT];

          return this.$store.getters['management/byId'](MANAGEMENT.PROJECT, `${ cluster.id }/${ id }`);
        }
      }

      return null;
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
      const displayName = this.value?.parentNameOverride || this.$store.getters['type-map/labelFor'](this.schema);
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
          value:    _DETAIL,
        });
      }

      if ( this.hasEdit && this.parent?.showConfigView !== false) {
        out.push({
          labelKey: 'resourceDetail.masthead.config',
          value:    _CONFIG,
        });
      }

      if ( this.hasGraph ) {
        out.push({
          labelKey: 'resourceDetail.masthead.graph',
          value:    _GRAPH,
        });
      }

      if ( this.canViewYaml ) {
        out.push({
          labelKey: 'resourceDetail.masthead.yaml',
          value:    _YAML,
        });
      }

      if ( out.length < 2 ) {
        return null;
      }

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
        case _GRAPH:
          this.$router.applyQuery({
            [MODE]: _UNFLAG,
            [AS]:   _GRAPH,
          });
          break;
        case _YAML:
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

    displayName() {
      let displayName = this.value.nameDisplay;

      if (this.isProjectHelmChart) {
        displayName = this.value.projectDisplayName;
      }

      return this.shouldHifenize ? ` - ${ displayName }` : displayName;
    },

    location() {
      const { parent } = this;

      return parent?.location;
    },

    hideNamespaceLocation() {
      return this.$store.getters['currentProduct'].hideNamespaceLocation || this.value.namespaceLocation === null;
    },

    resourceExternalLink() {
      return this.value.resourceExternalLink;
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
    },

    invokeDetailsAction() {
      const action = this.detailsAction;

      if (action) {
        const fn = this.value[action.action];

        if (fn) {
          fn.apply(this.value, []);
        }
      }
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
            <TabTitle
              v-if="isCreate"
              :showChild="false"
            >
              {{ parent.displayName }}
            </TabTitle>
            <TabTitle
              v-else
              :showChild="false"
            >
              {{ displayName }}
            </TabTitle>
            <router-link
              v-if="location"
              :to="location"
              role="link"
              class="masthead-resource-list-link"
              :aria-label="parent.displayName"
            >
              {{ parent.displayName }}:
            </router-link>
            <span v-else>{{ parent.displayName }}:</span>
            <span v-if="value?.detailPageHeaderActionOverride && value?.detailPageHeaderActionOverride(realMode)">{{ value?.detailPageHeaderActionOverride(realMode) }}</span>
            <t
              v-else
              class="masthead-resource-title"
              :k="'resourceDetail.header.' + realMode"
              :subtype="resourceSubtype"
              :name="displayName"
              :escapehtml="false"
            />
            <BadgeState
              v-if="!isCreate && parent.showState"
              class="masthead-state"
              :value="value"
            />
            <span
              v-if="!isCreate && value.injectionEnabled"
              class="masthead-istio"
            >
              <i
                v-clean-tooltip="t('projectNamespaces.isIstioInjectionEnabled')"
                class="icon icon-sm icon-istio"
              />
            </span>
            <a
              v-if="dev && !!resourceExternalLink"
              v-clean-tooltip="t(resourceExternalLink.tipsKey || 'generic.resourceExternalLinkTips')"
              class="resource-external"
              rel="nofollow noopener noreferrer"
              target="_blank"
              :href="resourceExternalLink.url"
            >
              <i class="icon icon-external-link" />
            </a>
          </h1>
        </div>
        <div
          v-if="!isCreate"
          class="subheader"
        >
          <span v-if="isNamespace && project">{{ t("resourceDetail.masthead.project") }}: <router-link :to="project.detailLocation">{{ project.nameDisplay }}</router-link></span>
          <span v-else-if="isWorkspace">{{ t("resourceDetail.masthead.workspace") }}: <router-link :to="workspaceLocation">{{ namespace }}</router-link></span>
          <span v-else-if="namespace && !hasMultipleNamespaces">
            {{ t("resourceDetail.masthead.namespace") }}:
            <router-link
              v-if="!hideNamespaceLocation"
              :to="namespaceLocation"
              data-testid="masthead-subheader-namespace"
            >
              {{ namespace }}
            </router-link>
            <span v-else>
              {{ namespace }}
            </span>
          </span>
          <span v-if="parent.showAge">
            {{ t("resourceDetail.masthead.age") }}:
            <LiveDate
              class="live-date"
              :value="value.creationTimestamp"
            />
          </span>
          <span
            v-if="value.showCreatedBy"
            data-testid="masthead-subheader-createdBy"
          >
            {{ t("resourceDetail.masthead.createdBy") }}:
            <router-link
              v-if="value.createdBy.location"
              :to="value.createdBy.location"
              data-testid="masthead-subheader-createdBy-link"
            >
              {{ value.createdBy.displayName }}
            </router-link>
            <span
              v-else
              data-testid="masthead-subheader-createdBy_plain-text"
            >
              {{ value.createdBy.displayName }}
            </span>
          </span>
          <span v-if="value.showPodRestarts">{{ t("resourceDetail.masthead.restartCount") }}:<span class="live-data"> {{ value.restartCount }}</span></span>
        </div>
      </div>
      <slot name="right">
        <div class="actions-container align-start">
          <div class="actions">
            <button
              v-if="detailsAction && currentView === DETAIL_VIEW && isView"
              type="button"
              class="btn role-primary actions mr-10"
              :disabled="!detailsAction.enabled"
              @click="invokeDetailsAction"
            >
              {{ detailsAction.label }}
            </button>
            <ButtonGroup
              v-if="showSensitiveToggle"
              :value="!!hideSensitiveData"
              icon-size="lg"
              :options="sensitiveOptions"
              class="mr-10"
              @update:value="toggleSensitiveData"
            />

            <ButtonGroup
              v-if="viewOptions && isView"
              v-model:value="currentView"
              :options="viewOptions"
              class="mr-10"
            />

            <button
              v-if="isView"
              ref="actions"
              data-testid="masthead-action-menu"
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

    <!-- Extension area -->
    <ExtensionPanel
      :resource="value"
      :type="extensionType"
      :location="extensionLocation"
    />

    <Banner
      v-if="banner && isView && !parent.hideBanner"
      class="state-banner mb-10"
      :color="banner.color"
      :label="banner.message"
    />
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
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .primaryheader {
    display: flex;
    flex-direction: row;
    align-items: center;

    h1 {
      margin: 0 0 0 -5px;
      overflow-x: hidden;
      display: flex;
      flex-direction: row;
      align-items: center;

      .masthead-resource-title {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }

      .masthead-resource-list-link {
        margin: 5px;
      }
    }
  }

  .subheader{
    display: flex;
    flex-direction: row;
    color: var(--input-label);
    & > * {
      margin: 5px 20px 5px 0px;
    }

    .live-data {
      color: var(--body-text);
      margin-left: 3px;
    }
  }

  .state-banner {
    margin: 3px 0 0 0;
  }

  .masthead-state {
    margin-left: 8px;
    font-size: initial;
  }

  .masthead-istio {
    .icon {
      vertical-align: middle;
      color: var(--primary);
    }
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

  div.actions-container > div.actions {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
  }

  .resource-external {
    font-size: 18px;
  }
</style>
