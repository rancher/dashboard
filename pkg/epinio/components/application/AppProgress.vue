<script lang="ts">
import Vue, { PropType } from 'vue';
import ApplicationAction, { APPLICATION_ACTION_TYPE } from '../../models/application-action';

import SortableTable from '@shell/components/SortableTable/index.vue';
import Checkbox from '@shell/components/form/Checkbox.vue';
import BadgeState from '@shell/components/BadgeState.vue';
import { STATE, DESCRIPTION } from '@shell/config/table-headers';
import { EPINIO_TYPES, APPLICATION_ACTION_STATE, APPLICATION_SOURCE_TYPE, EpinioApplication } from '../../types';
import { EpinioAppSource } from '../../components/application/AppSource.vue';
import { EpinioAppBindings } from '~/pkg/epinio/components/application/AppConfiguration.vue';

interface Data {
  running: boolean;
  actionHeaders: any[];
  actions: ApplicationAction[]
}

export default Vue.extend<Data, any, any, any>({

  components: {
    SortableTable,
    BadgeState,
    Checkbox,
  },

  props: {
    application: {
      type:     Object as PropType<EpinioApplication>,
      required: true
    },
    source: {
      type:     Object as PropType<EpinioAppSource>,
      required: true
    },
    bindings: {
      type:     Object as PropType<EpinioAppBindings>,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
    step: {
      type:     Object as PropType<any>,
      required: true
    }
  },

  async fetch() {
    const coreArgs = {
      application: this.application,
      bindings:    this.bindings,
      type:        EPINIO_TYPES.APP_ACTION,
    };

    this.actions.push(await this.$store.dispatch('epinio/create', {
      action:      APPLICATION_ACTION_TYPE.CREATE,
      index:       0, // index used for sorting
      ...coreArgs,
    }));

    if (this.bindings?.configurations?.length) {
      this.actions.push(await this.$store.dispatch('epinio/create', {
        action:      APPLICATION_ACTION_TYPE.BIND_CONFIGURATIONS,
        index:       1,
        ...coreArgs,
      }));
    }

    if (this.bindings?.services?.length) {
      this.actions.push(await this.$store.dispatch('epinio/create', {
        action:      APPLICATION_ACTION_TYPE.BIND_SERVICES,
        index:       2,
        ...coreArgs,
      }));
    }

    if (this.source.type === APPLICATION_SOURCE_TYPE.ARCHIVE ||
        this.source.type === APPLICATION_SOURCE_TYPE.FOLDER) {
      this.actions.push(await this.$store.dispatch('epinio/create', {
        action:      APPLICATION_ACTION_TYPE.UPLOAD,
        index:       3,
        ...coreArgs,
      }));
    }

    if (this.source.type === APPLICATION_SOURCE_TYPE.GIT_URL) {
      this.actions.push(await this.$store.dispatch('epinio/create', {
        action:      APPLICATION_ACTION_TYPE.GIT_FETCH,
        index:       3,
        ...coreArgs,
      }));
    }

    if (this.source.type === APPLICATION_SOURCE_TYPE.ARCHIVE ||
        this.source.type === APPLICATION_SOURCE_TYPE.FOLDER ||
        this.source.type === APPLICATION_SOURCE_TYPE.GIT_URL) {
      this.actions.push(await this.$store.dispatch('epinio/create', {
        action:      APPLICATION_ACTION_TYPE.BUILD,
        index:       4,
        ...coreArgs,
      }));
    }

    this.actions.push(await this.$store.dispatch('epinio/create', {
      action:      APPLICATION_ACTION_TYPE.DEPLOY,
      index:       5,
      ...coreArgs,
    }));

    this.create();
  },

  data() {
    return {
      running:       false,
      actionHeaders: [
        {
          name:     'epinio-name',
          labelKey: 'epinio.applications.steps.progress.table.stage.label',
          value:    'name',
          sort:     ['index'],
          width:    100,
        },
        {
          ...DESCRIPTION,
          sort:          undefined,
          value:         'description',
          width:         450,
        },
        {
          ...STATE,
          sort:     undefined,
          labelKey: 'epinio.applications.steps.progress.table.status',
          width:    150
        },
      ],
      actions: [],
      APPLICATION_ACTION_STATE
    };
  },

  computed: {
    actionsToRun() {
      return this.actions.filter((action: ApplicationAction) => action.run);
    }
  },

  watch: {
    running(neu, prev) {
      if (prev && !neu) {
        Vue.set(this.step, 'ready', true);
      }
    }
  },

  methods: {
    async fetchApp() {
      try {
        await this.application.forceFetch();
      } catch (err) {

      }
    },

    async create() {
      Vue.set(this, 'running', true);

      const enabledActions = [...this.actionsToRun];

      for (const action of enabledActions) {
        try {
          // TODO: RC bind to SI action
          await action.execute({ source: this.source });
        } catch (err) {
          Vue.set(this, 'running', false);
          console.error(err);// eslint-disable-line no-console

          await this.fetchApp();

          return;
        }
      }
      await this.fetchApp();
      Vue.set(this, 'running', false);
      this.$emit('finished', true);
    }
  }
});

</script>

<template>
  <div v-if="!$fetchState.pending" class="progress-container">
    <div class="progress">
      <SortableTable
        :rows="actions"
        :headers="actionHeaders"
        :table-actions="false"
        :row-actions="false"
        default-sort-by="epinio-name"
        :search="false"
        key-field="key"
      >
        <template #cell:index="{row}">
          <Checkbox v-model="row.run" :disabled="true" />
        </template>
        <template #cell:state="{row}">
          <div class="status">
            <i
              v-if="row.state === APPLICATION_ACTION_STATE.RUNNING"
              v-tooltip="row.stateDisplay"
              class="icon icon-lg icon-spinner icon-spin"
            />
            <BadgeState v-else :color="row.stateBackground" :label="row.stateDisplay" class="badge" />
          </div>
        </template>
      </SortableTable>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.progress-container {
  display: flex;
  justify-content: center;
  .progress {
    padding: 10px 0;

    $statusHeight: 20px;
    .status {
      min-height: $statusHeight; // Ensure switching from spinner to badge doesn't wibble
      display: flex;
      align-items: center;

      .badge {
        min-height: $statusHeight;
      }

    }
  }
}

</style>
