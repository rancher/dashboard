<script>
import { PROJECT } from '../../config/labels-annotations';
import BreadCrumbs from '@/components/BreadCrumbs';
import { NAMESPACE, EXTERNAL } from '@/config/types';

export default {
  components: { BreadCrumbs },
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

    hasDetail: {
      type:    Boolean,
      default: false
    }
  },

  computed: {
    schema() {
      return this.$store.getters['cluster/schemaFor']( this.value.type );
    },

    h1() {
      const typeLink = this.$router.resolve({
        name:   this.doneRoute,
        params: this.$route.params
      }).href;

      const out = this.$store.getters['i18n/t'](`resourceDetail.header.${ this.realMode }`, {
        typeLink,
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
  <header>
    <BreadCrumbs class="breadcrumbs" />
    <div>
      <h1 v-html="h1" />
      <!-- //TODO use  nuxt-link for an internal project detail page once it exists -->
      <span v-if="isNamespace">Project: <a :href="project.links.self">{{ project.id }}</a></span>
      <span v-else-if="namespace">Namespace: <nuxt-link :to="namespaceLocation">{{ namespace }}</nuxt-link></span>
    </div>
    <div v-if="mode==='view'" class="actions">
      <!-- //TODO remove check for custom detail component once there is a generic detail -->
      <div v-if="hasDetail" class="yaml-toggle">
        <button id="yaml-on" :disabled="asYaml" class="btn btn-sm role-primary" @click="toggleYaml">
          YAML
        </button>
        <button id="yaml-off" :disabled="!asYaml" class="btn btn-sm role-primary" @click="toggleYaml">
          Overview
        </button>
      </div>
      <button ref="actions" aria-haspopup="true" type="button" class="btn btn-sm role-multi-action actions" @click="showActions">
        <i class="icon icon-actions" />
      </button>
    </div>
  </header>
</template>

<style lang='scss'>
  .yaml-toggle{
    display: inline-flex;

    & #yaml-on{
      border-radius: calc(var(--border-radius) * 2) 0px  0px calc(var(--border-radius) * 2);
    }

    & #yaml-off{
      border-radius:  0px  calc(var(--border-radius) * 2) calc(var(--border-radius) * 2) 0px;
    }
  }
</style>
