<script>
import { PROJECT } from '@/config/labels-annotations';
import { FLEET, NAMESPACE, MANAGEMENT } from '@/config/types';
import ButtonGroup from '@/components/ButtonGroup';
import BadgeState from '@/components/BadgeState';
import Banner from '@/components/Banner';
import { get } from '@/utils/object';
import { NAME as FLEET_NAME } from '@/config/product/fleet';
import { _CREATE, _EDIT, _VIEW } from '@/config/query-params';

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

    asYaml: {
      type:    Boolean,
      default: false
    },

    hasDetailOrEdit: {
      type:    Boolean,
      default: false
    },

    parentOverride: {
      type:    Object,
      default: null
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

    h1() {
      const out = this.$store.getters['i18n/t'](`resourceDetail.header.${ this.realMode }`, {
        type: this.$store.getters['type-map/labelFor'](this.schema),
        name: this.value?.nameDisplay,
      });

      return out;
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

      const out = { displayName, location };

      if (this.parentOverride) {
        Object.assign(out, this.parentOverride);
      }

      return out ;
    }
  },
  methods: {
    get,
    showActions() {
      this.$store.commit('action-menu/show', {
        resources: this.value,
        elem:      this.$refs.actions,
      });
    },

    toggleYaml(val) {
      this.$emit('update:asYaml', val);
    }
  }
};
</script>

<template>
  <header class="masthead">
    <div class="title">
      <div class="primaryheader">
        <h1 v-if="isCreate || isEdit || isView">
          <nuxt-link :to="parent.location">
            {{ parent.displayName }}:
          </nuxt-link>
          <t v-if="isCreate" k="resourceDetail.header.create" />
          <t v-if="isEdit" k="resourceDetail.header.edit" />
          <span v-if="resourceSubtype" v-html="resourceSubtype" />
          <span v-if="!isCreate" v-html="value.nameDisplay" />
        </h1>
        <h1 v-else>
          <nuxt-link :to="parent.location">
            {{ parent.displayName }}:
          </nuxt-link>
          <span v-html="h1" />
        </h1>
        <BadgeState v-if="isView && !parent.hideBadgeState" :value="value" />
      </div>
      <!-- //TODO use  nuxt-link for an internal project detail page once it exists -->
      <div v-if="isView" class="subheader">
        <span v-if="isNamespace && project">{{ t("resourceDetail.masthead.project") }}: {{ project.nameDisplay }}</span>
        <span v-else-if="isWorkspace">{{ t("resourceDetail.masthead.workspace") }}: <nuxt-link :to="workspaceLocation">{{ namespace }}</nuxt-link></span>
        <span v-else-if="namespace">{{ t("resourceDetail.masthead.namespace") }}: <nuxt-link :to="namespaceLocation">{{ namespace }}</nuxt-link></span>
        <span v-if="!parent.hideAge">{{ t("resourceDetail.masthead.age") }}: <LiveDate class="live-date" :value="get(value, 'metadata.creationTimestamp')" /></span>
      </div>
    </div>
    <slot name="right">
      <div v-if="isView" class="actions">
        <div v-if="hasDetailOrEdit">
          <ButtonGroup :labels-are-translations="true" :value="asYaml" :options="[{label: 'resourceDetail.masthead.overview', value: false},{label:'resourceDetail.masthead.yaml', value: true }]" @input="toggleYaml" />
        </div>
        <button ref="actions" aria-haspopup="true" type="button" class="btn btn-sm role-multi-action actions" @click="showActions">
          <i class="icon icon-actions" />
        </button>
      </div>
    </slot>
    <div v-if="banner && isView && !parent.hideBanner" class="state-banner">
      <Banner class="state-banner" :color="banner.color" :label="banner.message" />
    </div>
  </header>
</template>

<style lang='scss'>
  .masthead {
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
  }

</style>
