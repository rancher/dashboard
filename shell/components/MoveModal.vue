<script>
import { mapState, mapGetters } from 'vuex';
import { Card } from '@components/Card';
import AsyncButton from '@shell/components/AsyncButton';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { MANAGEMENT } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import { PROJECT } from '@shell/config/labels-annotations';

export default {
  components: {
    AsyncButton, Card, LabeledSelect, Loading
  },

  async fetch() {
    this.projects = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT });
  },

  data() {
    return {
      modalName: 'move-modal', projects: [], targetProject: null
    };
  },

  computed: {
    ...mapState('action-menu', ['showPromptMove', 'toMove']),
    ...mapGetters(['currentCluster']),

    excludedProjects() {
      return this.toMove.filter(namespace => !!namespace.project).map(namespace => namespace.project.shortId);
    },

    projectOptions() {
      return this.projects.reduce((inCluster, project) => {
        if (!this.excludedProjects.includes(project.shortId) && project.spec?.clusterName === this.currentCluster.id) {
          inCluster.push({
            value: project.shortId,
            label: project.nameDisplay
          });
        }

        return inCluster;
      }, []);
    }
  },

  watch: {
    showPromptMove(show) {
      if (show) {
        this.$modal.show(this.modalName);
      } else {
        this.$modal.hide(this.modalName);
      }
    }
  },

  methods: {
    close() {
      this.$store.commit('action-menu/togglePromptMove');
    },

    async move(finish) {
      const cluster = this.$store.getters['currentCluster'];
      const clusterWithProjectId = `${ cluster.id }:${ this.targetProject }`;

      const promises = this.toMove.map((namespace) => {
        namespace.setLabel(PROJECT, this.targetProject);
        namespace.setAnnotation(PROJECT, clusterWithProjectId);

        return namespace.save();
      });

      try {
        this.$emit('moving');
        await Promise.all(promises);
        finish(true);
        this.targetProject = null;
        this.close();
      } catch (ex) {
        finish(false);
      }
    }
  }
};
</script>
<template>
  <modal
    class="move-modal"
    :name="modalName"
    :width="440"
    height="auto"
    @closed="close"
  >
    <Loading v-if="$fetchState.pending" />
    <Card
      v-else
      class="move-modal-card"
      :show-highlight-border="false"
    >
      <h4
        slot="title"
        class="text-default-text"
      >
        {{ t('moveModal.title') }}
      </h4>
      <div slot="body">
        <div>
          {{ t('moveModal.description') }}
          <ul class="namespaces">
            <li
              v-for="namespace in toMove"
              :key="namespace.id"
            >
              {{ namespace.nameDisplay }}
            </li>
          </ul>
        </div>
        <LabeledSelect
          v-model="targetProject"
          :options="projectOptions"
          :label="t('moveModal.targetProject')"
        />
      </div>
      <template #actions>
        <button
          class="btn role-secondary"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton
          :action-label="t('moveModal.moveButtonLabel')"
          class="btn bg-primary ml-10"
          :disabled="!targetProject"
          @click="move"
        />
      </template>
    </Card>
  </modal>
</template>

<style lang='scss'>
  .move-modal {
    .namespaces {
      max-height: 200px;
      overflow-y: scroll;
    }

    .move-modal-card {
        box-shadow: none;

        border-radius: var(--border-radius);
    }

    .actions {
      text-align: right;
    }
    .card-actions {
      display: flex;
      justify-content: center;
    }
  }
</style>
