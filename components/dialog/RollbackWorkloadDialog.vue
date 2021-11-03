<script>
import AsyncButton from '@/components/AsyncButton';
import day from 'dayjs';
import Card from '@/components/Card';
import { exceptionToErrorsArray } from '@/utils/error';
import LabeledSelect from '@/components/form/LabeledSelect';
import Banner from '@/components/Banner';
import YamlEditor, { EDITOR_MODES } from '@/components/YamlEditor';
import { WORKLOAD_TYPES } from '@/config/types';
import { diffFrom } from '@/utils/time';
import { mapGetters } from 'vuex';

export default {
  components: {
    Card,
    AsyncButton,
    LabeledSelect,
    Banner,
    YamlEditor,
  },
  props:      {
    resources: {
      type:     Array,
      required: true
    }
  },
  data() {
    return {
      errors:             [],
      selectedRevision:   null,
      currentRevision:    null,
      revisions:          [],
      editorMode:       EDITOR_MODES.DIFF_CODE,
      hiddenFields:     ['created', 'creatorId', 'links', 'name', 'ownerReferences', 'removed', 'scale', 'state', 'uuid', 'workloadLabels', 'workloadAnnotations']
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    workload() {
      return this.resources[0];
    },
    workloadName() {
      return this.workload.metadata.name;
    },
    workloadNamespace() {
      return this.workload.metadata.namespace;
    },
    currentRevisionNumber() {
      return this.workload.metadata.annotations['deployment.kubernetes.io/revision'];
    },
    rollbackRequestBody() {
      if (!this.selectedRevision) {
        return null;
      }

      // Build the request body in the same format that kubectl
      // uses to call the Kubernetes API to roll back a workload.
      // To see an example request body, run:
      // kubectl rollout undo deployment/[deployment name] --to-revision=[revision number] -v=8
      const body = [
        {
          op:      'replace',
          path:  '/spec/template',
          value: {
            metadata: {
              creationTimestamp: null,
              labels:            { 'workload.user.cattle.io/workloadselector': this.selectedRevision.spec.template.metadata.labels['workload.user.cattle.io/workloadselector'] }
            },
            spec: this.selectedRevision.spec.template.spec
          }
        }, {
          op:    'replace',
          path:  '/metadata/annotations',
          value: { 'deployment.kubernetes.io/revision': this.selectedRevision.metadata.annotations['deployment.kubernetes.io/revision'] }
        }
      ];

      return body;
    },
    selectedRevisionId() {
      return this.selectedRevision.id;
    }
  },
  fetch() {
    // Fetch revisions of the current workload
    this.$store.dispatch('cluster/findAll', { type: WORKLOAD_TYPES.REPLICA_SET })
      .then(( response ) => {
        const allReplicaSets = response;

        const hasRelationshipWithCurrentWorkload = ( replicaSet ) => {
          const relationshipsOfReplicaSet = replicaSet.metadata.relationships;

          const revisionsOfCurrentWorkload = relationshipsOfReplicaSet.filter(( relationship ) => {
            const isRevisionOfCurrentWorkload = relationship.fromId && relationship.fromId === `${ this.workloadNamespace }/${ this.workloadName }`;

            return isRevisionOfCurrentWorkload;
          });

          return revisionsOfCurrentWorkload.length > 0;
        };

        const workloadRevisions = allReplicaSets.filter(( replicaSet ) => {
          return hasRelationshipWithCurrentWorkload( replicaSet );
        });

        const revisionOptions = workloadRevisions.map( (revision ) => {
          const isCurrentRevision = this.getRevisionNumber(revision) === this.currentRevisionNumber;

          if (isCurrentRevision) {
            this.currentRevision = revision;
          }

          return this.buildRevisionOption( revision );
        });

        this.revisions = revisionOptions;
      })
      .catch(( err ) => {
        this.errors = exceptionToErrorsArray(err);
      });
  },
  methods: {
    close() {
      this.$emit('close');
    },
    async save() {
      try {
        await this.workload.rollBackWorkload(this.workload, this.rollbackRequestBody);
        this.close();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
      }
    },
    getRevisionNumber( revision ) {
      return revision.metadata.annotations['deployment.kubernetes.io/revision'];
    },
    buildRevisionOption( revision ) {
      const revisionNumber = this.getRevisionNumber(revision);
      const isCurrentRevision = revisionNumber === this.currentRevisionNumber;
      const now = day();
      const createdDate = day(revision.metadata.creationTimestamp);
      const revisionAge = diffFrom(createdDate, now, this.t);
      const units = this.t(revisionAge.unitsKey, { count: revisionAge.label });
      const currentLabel = this.t('promptRollback.currentLabel');
      const optionLabel = this.t('promptRollback.revisionOption', {
        revisionNumber,
        revisionAge:    revisionAge.label,
        units,
        currentLabel:   isCurrentRevision ? currentLabel : ''
      });

      return {
        label:    optionLabel,
        value:    revision,
        disabled: isCurrentRevision
      };
    },
    getOptionLabel(option) {
      return option.label;
    },
  }
};
</script>

<template>
  <Card
    class="prompt-rollback"
    :show-highlight-border="false"
  >
    <h4 slot="title" class="text-default-text">
      {{ t('promptRollback.modalTitle', { workloadName }, true) }}
    </h4>
    <div slot="body" class="pl-10 pr-10">
      <Banner v-if="revisions.length === 1" color="info" :label="t('promptRollback.singleRevisionBanner')" />
      <form>
        <LabeledSelect

          v-model="selectedRevision"
          class="provider"
          :label="t('promptRollback.dropdownTitle')"
          :placeholder="t('promptRollback.placeholder')"
          :options="revisions"
          :get-option-label="getOptionLabel"
        />
      </form>
      <Banner v-for="(error, i) in errors" :key="i" class="" color="error" :label="error" />
      <YamlEditor
        v-if="selectedRevision"
        :key="selectedRevisionId"
        v-model="selectedRevision"
        :initial-yaml-values="currentRevision"
        class="yaml-editor"
        :editor-mode="editorMode"
        :as-object="true"
      />
    </div>
    <div slot="actions" class="buttons right-align">
      <button class="btn role-secondary mr-10" @click="close">
        {{ t('generic.cancel') }}
      </button>
      <AsyncButton
        :action-label="t('asyncButton.rollback.action')"
        :disabled="!selectedRevision"
        get-option-label="getOptionLabel"
        :right-align="true"
        @click="save"
      />
    </div>
  </Card>
</template>
<style lang='scss' scoped>
  .prompt-rollback {
    margin: 0;
    position: absolute;
    left: 10px;
  }
  .right-align {
    margin-right: 0;
    margin-left: auto;
  }
  .bottom {
    flex-direction: column;
    flex: 1;
    .banner {
      margin-top: 0
    }
    .buttons {
      display: flex;
      justify-content: flex-end;
      width: 100%;
    }
  }
</style>
