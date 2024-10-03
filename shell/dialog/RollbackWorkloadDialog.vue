<script>
import AsyncButton from '@shell/components/AsyncButton';
import day from 'dayjs';
import { Card } from '@components/Card';
import { exceptionToErrorsArray } from '@shell/utils/error';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Banner } from '@components/Banner';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import { WORKLOAD_TYPES } from '@shell/config/types';
import { diffFrom } from '@shell/utils/time';
import { mapGetters } from 'vuex';
import { ACTIVELY_REMOVE, NEVER_ADD } from '@shell/utils/create-yaml';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { escapeHtml } from '@shell/utils/string';

const HIDE = [
  'metadata.labels.pod-template-hash',
  'spec.selector.matchLabels.pod-template-hash',
  'spec.template.metadata.labels.pod-template-hash',
  'metadata.fields'
];

const REMOVE = [...ACTIVELY_REMOVE, ...NEVER_ADD, ...HIDE];

const REMOVE_KEYS = REMOVE.reduce((obj, item) => {
  obj[item] = true;

  return obj;
}, {});

export default {
  emits: ['close'],

  components: {
    Card,
    AsyncButton,
    LabeledSelect,
    Banner,
    YamlEditor,
  },
  props: {
    workload: {
      type:     Object,
      required: true
    }
  },
  data() {
    return {
      errors:           [],
      selectedRevision: null,
      currentRevision:  null,
      revisions:        [],
      editorMode:       EDITOR_MODES.DIFF_CODE,
      showDiff:         false,
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    ...mapGetters(['currentCluster']),
    workloadName() {
      return this.workload.metadata.name;
    },
    workloadNamespace() {
      return this.workload.metadata.namespace;
    },
    workloadType() {
      return this.workload.kind.toLowerCase();
    },
    revisionsType() {
      return this.workloadType === 'deployment' ? WORKLOAD_TYPES.REPLICA_SET : 'apps.controllerrevision';
    },
    selectedRevisionId() {
      return this.selectedRevision.id;
    },
    sanitizedSelectedRevision() {
      return this.sanitizeYaml(this.selectedRevision);
    },
    timeFormatStr() {
      const dateFormat = escapeHtml( this.$store.getters['prefs/get'](DATE_FORMAT));
      const timeFormat = escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));

      return `${ dateFormat }, ${ timeFormat }`;
    },
  },
  fetch() {
    // Fetch revisions of the current workload
    this.$store.dispatch('cluster/findAll', { type: this.revisionsType })
      .then(( response ) => {
        const allRevisions = response;

        const hasRelationshipWithCurrentWorkload = ( replicaSet ) => {
          const relationshipsOfReplicaSet = replicaSet.metadata.relationships;

          const revisionsOfCurrentWorkload = relationshipsOfReplicaSet.filter(( relationship ) => {
            const isRevisionOfCurrentWorkload = relationship.fromId && relationship.fromId === `${ this.workloadNamespace }/${ this.workloadName }`;

            return isRevisionOfCurrentWorkload;
          });

          return revisionsOfCurrentWorkload.length > 0;
        };

        const workloadRevisions = allRevisions.filter(( replicaSet ) => {
          return hasRelationshipWithCurrentWorkload( replicaSet );
        });

        const revisionOptions = workloadRevisions
          .map( (revision ) => {
            if (this.isCurrentRevision(revision)) {
              this.currentRevision = revision;
            }

            return this.buildRevisionOption( revision );
          })
          .sort((a, b) => b.revisionNumber - a.revisionNumber);

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
        await this.workload.rollBack(this.currentCluster, this.workload, this.selectedRevision);
        this.close();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
      }
    },
    isCurrentRevision(revision) {
      return revision.revisionNumber === this.workload.currentRevisionNumber;
    },
    buildRevisionOption( revision ) {
      const { revisionNumber } = revision;
      const isCurrentRevision = this.isCurrentRevision(revision);
      const now = day();
      const createdDate = day(revision.metadata.creationTimestamp);
      const createdDateFormatted = createdDate.format(this.timeFormatStr);

      const revisionAgeObject = diffFrom(createdDate, now, this.t);
      const revisionAge = `${ createdDateFormatted }, ${ revisionAgeObject.label }`;
      const units = this.t(revisionAgeObject.unitsKey, { count: revisionAgeObject.label });
      const currentLabel = this.t('promptRollback.currentLabel');

      const optionLabel = this.t('promptRollback.revisionOption', {
        revisionNumber,
        revisionAge,
        units,
        currentLabel: isCurrentRevision ? currentLabel : ''
      });

      return {
        label:    optionLabel,
        value:    revision,
        disabled: isCurrentRevision,
        revisionNumber
      };
    },
    getOptionLabel(option) {
      return option.label;
    },
    sizeDialog() {
      const dialogs = document.getElementsByClassName('modal-container');
      const width = this.showDiff ? '85%' : '600px';

      if (dialogs.length === 1) {
        dialogs[0].style.setProperty('width', width);
      }
    },
    sanitizeYaml(obj, path = '') {
      const res = {};

      if (!obj) {
        return obj;
      }

      Object.keys(obj).forEach((key) => {
        const keyPath = !path ? key : `${ path }.${ key }`;

        if (!REMOVE_KEYS[keyPath]) {
          res[key] = obj[key];

          if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            res[key] = this.sanitizeYaml(obj[key], keyPath);
          }
        }
      });

      return res;
    }
  }
};
</script>

<template>
  <Card
    class="prompt-rollback"
    :show-highlight-border="false"
  >
    <template #title>
      <h4 class="text-default-text">
        {{ t('promptRollback.modalTitle', { workloadName }, true) }}
      </h4>
    </template>
    <template #body>
      <div class="pl-10 pr-10 ">
        <Banner
          v-if="revisions.length === 1"
          color="info"
          :label="t('promptRollback.singleRevisionBanner')"
        />
        <form>
          <LabeledSelect
            v-model:value="selectedRevision"
            class="provider"
            :label="t('promptRollback.dropdownTitle')"
            :placeholder="t('promptRollback.placeholder')"
            :options="revisions"
            :get-option-label="getOptionLabel"
          />
        </form>
        <Banner
          v-for="(error, i) in errors"
          :key="i"
          class=""
          color="error"
          :label="error"
        />
        <YamlEditor
          v-if="selectedRevision && showDiff"
          :key="selectedRevisionId"
          v-model:value="sanitizedSelectedRevision"
          :initial-yaml-values="sanitizeYaml(currentRevision)"
          class="mt-10 "
          :editor-mode="editorMode"
          :as-object="true"
        />
      </div>
    </template>
    <template #actions>
      <div class="buttons ">
        <div class="left">
          <button
            :disabled="!selectedRevision"
            class="btn role-secondary diff"
            @click="showDiff = !showDiff; sizeDialog()"
          >
            {{ showDiff ? t('resourceYaml.buttons.hideDiff') : t('resourceYaml.buttons.diff') }}
          </button>
        </div>
        <div class="right">
          <button
            class="btn role-secondary mr-10"
            @click="close"
          >
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
      </div>
    </template>
  </Card>
</template>
<style lang='scss' scoped>

.prompt-rollback {
  margin: 0;

  & :deep() .card-actions {
    display: grid;
  }
}

.yaml-editor {
  max-height: 70vh;

  & :deep().root {
    max-height: 65vh;
  }
}

.diff {
  &:disabled {
    border: none;
  }
  &:focus {
    background: transparent;
    box-shadow: none;
  }
}

:deep() .card-body {
  max-height: calc(95vh - 135px);
  overflow: hidden;
}

</style>
