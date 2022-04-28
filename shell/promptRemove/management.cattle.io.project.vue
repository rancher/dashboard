<script>
import { mapState, mapGetters } from 'vuex';
import { PROJECT } from '@shell/config/labels-annotations';
import { MANAGEMENT, NAMESPACE } from '@shell/config/types';
import { Checkbox } from '@components/Form/Checkbox';
import { resourceNames } from '@shell/utils/string';

export default {
  name: 'ProjectAndNamespacesPromptRemove',

  components: { Checkbox },

  props: {
    value: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    type: {
      type:     String,
      required: true
    }
  },

  async fetch() {
    this.allNamespaces = await this.$store.dispatch('cluster/findAll', { type: NAMESPACE });
    this.allProjects = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT });
  },

  data() {
    return {
      deleteProjectNamespaces: false,
      allNamespaces:           [],
      allProjects:             [],
    };
  },

  computed:   {
    ...mapState('action-menu', ['toRemove']),
    ...mapGetters({ t: 'i18n/t' }),
    ...mapGetters(['currentCluster']),

    currentProject() {
      if ( this.allProjects) {
        return this.value[0];
      }

      return {};
    },

    filteredNamespaces() {
      if (this.currentProject) {
        return this.allNamespaces.filter(n => n.metadata.labels[PROJECT] === this.currentProject.metadata?.name);
      }

      return [];
    },

    plusMore() {
      const remaining = this.filteredNamespaces.length > 5 ? this.filteredNamespaces.length - 5 : 0;

      return this.t('promptRemove.andOthers', { count: remaining });
    },

    displayName() {
      return this.currentProject?.spec?.displayName;
    },

    names() {
      return this.filteredNamespaces.map(obj => obj.nameDisplay).slice(0, 5);
    },
  },
  methods: {
    resourceNames,
    remove(btnCB) {
      if (this.deleteProjectNamespaces) {
        for (const resource of this.filteredNamespaces) {
          resource.remove();
        }
      }
      Promise.all(this.toRemove.map(resource => resource.remove()))
        .then(() => {
          this.$attrs.close();
        })
        .catch((err) => {
          this.$emit('errors', err);
          btnCB(false);
        })
      ;
    },
  },
};
</script>

<template>
  <div>
    <div>
      <div class="mb-10">
        {{ t('promptRemove.attemptingToRemove', { type }) }} <span class="display-name">{{ displayName }}</span>
      </div>
      <div v-if="filteredNamespaces.length > 0" class="mt-20">
        <Checkbox v-model="deleteProjectNamespaces" :label="t('promptRemove.deleteAssociatedNamespaces')" />
        <div class="mt-10 ml-20">
          <span v-html="resourceNames(names, plusMore, t)"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.display-name {
  font-weight: bold;
}
</style>
