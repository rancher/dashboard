<script>
import { PROJECT } from '@/config/labels-annotations';
import BreadCrumbs from '@/components/BreadCrumbs';
import { NAMESPACE, EXTERNAL } from '@/config/types';
import ButtonGroup from '@/components/ButtonGroup';
import BadgeState from '@/components/BadgeState';

export default {
  components: {
    BadgeState, BreadCrumbs, ButtonGroup
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

    doneRoute: {
      type:    String,
      default: ''
    },

    asYaml: {
      type:    Boolean,
      default: false
    },

    hasDetailOrEdit: {
      type:    Boolean,
      default: false
    }
  },

  computed: {
    schema() {
      return this.$store.getters['cluster/schemaFor']( this.value.type );
    },

    h1() {
      const out = this.$store.getters['i18n/t'](`resourceDetail.header.${ this.realMode }`, {
        type: this.$store.getters['type-map/singularLabelFor'](this.schema),
        name: this.value.nameDisplay,
      });

      return out;
    },

    isNamespace() {
      return this.schema.id === NAMESPACE;
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
          name:   'c-cluster-resource-id',
          params: {
            cluster:  this.$route.params.cluster,
            resource: NAMESPACE,
            id:       this.$route.params.namespace
          }
        };
      }

      return null;
    },

    project() {
      if (this.isNamespace) {
        const id = (this.value?.metadata?.labels || {})[PROJECT];

        return this.$store.getters['clusterExternal/byId'](EXTERNAL.PROJECT, id);
      } else {
        return null;
      }
    }
  },
  methods: {
    showActions() {
      this.$store.commit('action-menu/show', {
        resources: this.value,
        elem:      this.$refs.actions,
      });
    },

    toggleYaml() {
      const out = !this.asYaml;

      this.$emit('update:asYaml', out);
    }
  }
};
</script>

<template>
  <header class="masthead">
    <BreadCrumbs class="breadcrumbs" />
    <div>
      <div class="primaryheader">
        <h1 v-html="h1" />
        <BadgeState v-if="value.highlightBadge" class="highlight-badge" :value="value.highlightBadge" />
      </div>
      <!-- //TODO use  nuxt-link for an internal project detail page once it exists -->
      <div v-if="mode==='view'" class="subheader">
        <span v-if="isNamespace && project"><t k="resourceDetail.masthead.project" />: {{ project.nameDisplay }}</span>
        <span v-else-if="namespace"><t k="resourceDetail.masthead.namespace" />: <nuxt-link :to="namespaceLocation">{{ namespace }}</nuxt-link></span>
        <span v-if="value.description">{{ value.description }}</span>
      </div>
    </div>
    <div v-if="mode==='view'" class="actions">
      <div>
        <ButtonGroup :labels-are-translations="true" :value="asYaml" :options="[{label: 'resourceDetail.masthead.overview', value: false},{label:'resourceDetail.masthead.yaml', value: true }]" @input="toggleYaml" />
      </div>
      <button ref="actions" aria-haspopup="true" type="button" class="btn btn-sm role-multi-action actions" @click="showActions">
        <i class="icon icon-actions" />
      </button>
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

      .highlight-badge {
        margin-top: 2px;
        padding: 5px 8px 3px 8px;
        font-size: 12px;
      }
    }

    .subheader{
      display: flex;
      flex-direction: column;
      color: var(--input-label);
      & > * {
        margin: 5px 5px 5px 0px;
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
  }

</style>
