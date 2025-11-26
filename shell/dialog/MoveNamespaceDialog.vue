<script>
import { mapGetters } from 'vuex';
import { Card } from '@rc/Card';
import AsyncButton from '@shell/components/AsyncButton';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { MANAGEMENT } from '@shell/config/types';
import { PROJECT } from '@shell/config/labels-annotations';

export default {
  emits: ['close'],

  components: {
    AsyncButton, Card, LabeledSelect
  },

  props: {
    resources: {
      type:    Array,
      default: () => []
    },
    movingCb: {
      type:    Function,
      default: () => {}
    },
    registerBackgroundClosing: {
      type:    Function,
      default: () => {}
    }
  },

  async fetch() {
    this.toMove = this.resources;
    this.projects = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT });
  },

  data() {
    return {
      projects:      [],
      toMove:        [],
      targetProject: null
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    excludedProjects() {
      return this.toMove.filter((namespace) => !!namespace.project).map((namespace) => namespace.project.shortId);
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

  methods: {
    close(data) {
      this.$emit('close', data);
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
        await Promise.all(promises);
        finish(true);
        this.targetProject = null;
        this.close({ performCallback: true, moveNamespaceCb: true });
      } catch (ex) {
        finish(false);
      }
    }
  }
};
</script>
<template>
  <Card
    class="move-modal-card"
    :show-highlight-border="false"
  >
    <template #title>
      <h4 class="text-default-text">
        {{ t('moveModal.title') }}
      </h4>
    </template>
    <template #body>
      <div>
        {{ t('moveModal.description') }}
        <ul class="namespaces">
          <li
            v-for="(namespace, i) in toMove"
            :key="i"
          >
            {{ namespace.nameDisplay }}
          </li>
        </ul>
      </div>
      <LabeledSelect
        v-model:value="targetProject"
        :options="projectOptions"
        :label="t('moveModal.targetProject')"
      />
    </template>
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
</template>

<style lang='scss'>
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
</style>
