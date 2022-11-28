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

  computed: {
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
    // Only admins and cluster owners can see namespaces outside of projects
    canSeeProjectlessNamespaces() {
      return this.currentCluster.canUpdate;
    }
  },
  methods: {
    resourceNames,
    remove() {
      // Delete all of thre namespaces and return false - this tells the prompt remove dialog to continue and delete the project
      // Delete all namespaces if the user wouldn't be able to see them after deleting the project
      if (this.deleteProjectNamespaces || !this.canSeeProjectlessNamespaces) {
        return Promise.all(this.filteredNamespaces.map(n => n.remove())).then(() => false);
      }

      // Return false so that the main promptRemoval will continue to remove the project
      return false;
    },
  },
};
</script>

<template>
  <div>
    <div>
      <div class="mb-10">
        {{ t('promptRemove.attemptingToRemove', { type }) }} <span class="display-name">{{ `${displayName}.` }}</span>
        <template v-if="!canSeeProjectlessNamespaces">
          <span class="delete-warning"> {{ t('promptRemove.willDeleteAssociatedNamespaces') }}</span> <br>
          <div
            class="mt-10"
            v-html="resourceNames(names, plusMore, t)"
          />
        </template>
      </div>
      <div
        v-if="filteredNamespaces.length > 0 && canSeeProjectlessNamespaces"
        class="mt-20 remove-project-dialog"
      >
        <Checkbox
          v-model="deleteProjectNamespaces"
          :label="t('promptRemove.deleteAssociatedNamespaces')"
        />
        <div class="mt-10 ml-20">
          <span v-html="resourceNames(names, plusMore, t)" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.delete-warning{
    color: var(--error)
}
.remove-project-dialog {
  border: 1px solid var(--border);
  padding: 10px;
  border-radius: 5px;

  .display-name {
    font-weight: bold;
  }
}
</style>
