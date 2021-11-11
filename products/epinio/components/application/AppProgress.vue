<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '@/products/epinio/models/applications';
import ApplicationAction, { APPLICATION_ACTION_TYPE } from '@/products/epinio/models/application-action';

import SortableTable from '@/components/SortableTable/index.vue';
import Checkbox from '@/components/form/Checkbox.vue';
import BadgeState from '@/components/BadgeState.vue';
import { STATE, DESCRIPTION } from '@/config/table-headers';
import { EPINIO_TYPES, APPLICATION_ACTION_STATE, APPLICATION_SOURCE_TYPE } from '@/products/epinio/types';
import { EpinioAppSource } from '@/products/epinio/components/application/AppSource.vue';

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
      type:     Object as PropType<Application>,
      required: true
    },
    source: {
      type:     Object as PropType<EpinioAppSource>,
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
    this.actions.push(await this.$store.dispatch('epinio/create', {
      action:      APPLICATION_ACTION_TYPE.CREATE,
      application: this.application,
      type:        EPINIO_TYPES.APP_ACTION,
      index:       0, // index used for sorting
    }));
    if (this.source.type === APPLICATION_SOURCE_TYPE.ARCHIVE) {
      this.actions.push(await this.$store.dispatch('epinio/create', {
        action:      APPLICATION_ACTION_TYPE.UPLOAD,
        application: this.application,
        type:        EPINIO_TYPES.APP_ACTION,
        index:       1,
      }));
      this.actions.push(await this.$store.dispatch('epinio/create', {
        action:      APPLICATION_ACTION_TYPE.BUILD,
        application: this.application,
        type:        EPINIO_TYPES.APP_ACTION,
        index:       2,
      }));
    }

    this.actions.push(await this.$store.dispatch('epinio/create', {
      action:      APPLICATION_ACTION_TYPE.DEPLOY,
      application: this.application,
      type:        EPINIO_TYPES.APP_ACTION,
      index:       3,
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
        await this.aaplication.forceFetch();
      } catch (err) {

      }
    },

    async create() {
      Vue.set(this, 'running', true);

      const enabledActions = [...this.actionsToRun];

      for (const action of enabledActions) {
        try {
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
          <i
            v-if="row.state === APPLICATION_ACTION_STATE.RUNNING"
            v-tooltip="row.stateDisplay"
            class="icon icon-lg icon-spinner icon-spin"
          />
          <BadgeState v-else :color="row.stateBackground" :label="row.stateDisplay" />
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
  }
}

</style>
