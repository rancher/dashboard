<script>
import { mapGetters } from 'vuex';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { MANAGEMENT } from '@shell/config/types';
import { PROJECT } from '@shell/config/labels-annotations';
import { RcHeading } from '@components/RcHeading';
import { exceptionToErrorsArray } from '@shell/utils/error';

const NONE_VALUE = ' ';

export default {
  emits: ['close'],

  components: {
    AsyncButton, Banner, Card, LabeledSelect, RcHeading
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
      targetProject: null,
      errors:        []
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    excludedProjects() {
      return this.toMove.filter((namespace) => !!namespace.project).map((namespace) => namespace.project.shortId);
    },

    isAllInProject() {
      return this.toMove.every((namespace) => !!namespace.project);
    },

    projectOptions() {
      const options = this.projects.reduce((inCluster, project) => {
        if (!this.excludedProjects.includes(project.shortId) && project.spec?.clusterName === this.currentCluster.id) {
          inCluster.push({
            value: project.shortId,
            label: project.nameDisplay
          });
        }

        return inCluster;
      }, []);

      // To be consistent with listed projects we should only provide the option if it applies too all of the namespaces
      if (this.isAllInProject) {
        options.unshift({
          value: NONE_VALUE,
          label: this.t('moveModal.noProject')
        });
      }

      return options;
    }
  },

  methods: {
    close(data) {
      this.$emit('close', data);
    },

    async move(finish) {
      const cluster = this.$store.getters['currentCluster'];
      const clusterWithProjectId = this.targetProject && this.targetProject !== NONE_VALUE ? `${ cluster.id }:${ this.targetProject }` : null;

      this.errors = [];

      const results = await Promise.allSettled(this.toMove.map(async(namespace) => {
        // The namespace is the same object the list shows, so put the old project back if the save fails
        const previousLabel = namespace.metadata?.labels?.[PROJECT];
        const previousAnnotation = namespace.metadata?.annotations?.[PROJECT];

        namespace.setLabel(PROJECT, this.targetProject && this.targetProject !== NONE_VALUE ? this.targetProject : null);
        namespace.setAnnotation(PROJECT, clusterWithProjectId);

        try {
          await namespace.save();
        } catch (err) {
          namespace.setLabel(PROJECT, previousLabel);
          namespace.setAnnotation(PROJECT, previousAnnotation);

          throw err;
        }
      }));

      const failures = results.filter((result) => result.status === 'rejected');

      if (failures.length) {
        this.errors = failures.flatMap((failure) => exceptionToErrorsArray(failure.reason));
        finish(false);

        return;
      }

      finish(true);
      this.targetProject = null;
      this.close({ performCallback: true, moveNamespaceCb: true });
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
      <RcHeading
        :size="4"
        class="text-default-text"
      >
        {{ t('moveModal.title') }}
      </RcHeading>
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
      <Banner
        v-for="(error, i) in errors"
        :key="i"
        role="alert"
        color="error"
        :label="error"
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
        :disabled="targetProject === null"
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
