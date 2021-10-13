<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '@/products/epinio/models/applications.class';
import CreateEditView from '@/mixins/create-edit-view/impl';
import Loading from '@/components/Loading.vue';
import Wizard from '@/components/Wizard.vue';

import { EPINIO_TYPES } from '@/products/epinio/types';
import { exceptionToErrorsArray } from '@/utils/error';
import { isEmpty } from '@/utils/object';
import { _CREATE, _VIEW } from '@/config/query-params';
import AppInfo from './AppInfo.vue';
import AppSource from './AppSource.vue';
import AppService from './AppService.vue';
import AppProgress from './AppProgress.vue';

interface Data {
  errors: string[],
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  // TODO: RC View/Edit ... Refresh on page ... we won't have the namespace so fails

  components: {
    Loading,
    Wizard,
    AppInfo,
    AppSource,
    AppService,
    AppProgress,
  },

  props: {
    value: {
      type:     Object as PropType<Application>,
      required: true
    },
    originalValue: {
      type:     Object as PropType<Application>,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
  },

  mixins:     [
    CreateEditView,
  ],

  async fetch() {
    await this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.NAMESPACE });
  },

  data() {
    return {
      errors:  [],
      source: {
        tarBall:      null,
        builderImage: null
      },
      steps:   [{
        name:           'basics',
        label:          this.t('epinio.applications.steps.basics.label'),
        subtext:        this.t('epinio.applications.steps.basics.subtext'),
        ready:          true,
      }, {
        name:           'source',
        label:          this.t('epinio.applications.steps.source.label'),
        subtext:        this.t('epinio.applications.steps.source.subtext'),
        ready:          true,
      }, {
        name:           'services',
        label:          this.t('epinio.applications.steps.services.label'),
        subtext:        this.t('epinio.applications.steps.services.subtext'),
        ready:          true,
      }, {
        name:           'progress',
        label:          this.t('epinio.applications.steps.progress.label'),
        subtext:        this.t('epinio.applications.steps.progress.subtext'),
        ready:          true,
      }]
    };
  },

  computed: {
    valid() {
      return false; // TODO: RC
    },
    action() {
      return this.isCreate ? 'create' : 'update';
    },

    realMode() {
      if ( this.$route.params?.id ) {
        return this.$route.query.mode || _VIEW;
      } else {
        return _CREATE;
      }
    },

    jsonValue() {
      return JSON.stringify(this.value);
    }
  },

  methods: {
    update(change: any) {
      Object.entries(change).forEach(([key, value]: [string, any]) => {
        Vue.set(this.value, key, value);
      });
    },

    updateSource(change: any) {
      Vue.set(this.source, 'tarball', change.tarball);
      Vue.set(this.source, 'builderImage', change.builderImage);
    },

    async saveOverride(buttonDone: (res: boolean) => void): Promise<void> {
      this.errors = [];
      try {
        delete this.__rehydrate;
        delete this.__clone;

        const errors = await this.value.validationErrors(this);

        if (!isEmpty(errors)) {
          return Promise.reject(errors);
        }

        try {
          if (this.isCreate) {
            await this.value.create();
            const blobuid = await this.value.storeArchive(this.source.tarball);
            const { image, stage } = await this.value.stage(blobuid, this.source.builderImage);

            this.value.showStagingLog(stage.id);
            await this.value.waitForStaging(stage.id);
            await this.value.deploy(stage.id, image);
          } else {
            throw new Error('Not implemented');
          }

          this.done();
          buttonDone(true);
        } catch (err) {
          console.error(err);// eslint-disable-line no-console
          throw err;
        } finally {
          // TODO: RC `find` DOESN'T WORK... id doesn't contain namespace
          this.$store.dispatch('epinio/findAll', { type: this.value.type, opt: { force: true } });
          // await this.$dispatch('findAll', { type: this.type, opt: { force: true } });
        }
      } catch (e) {
        this.errors = exceptionToErrorsArray(e);
        buttonDone(false);
      }
    },

    cancel() {
      this.done();
    }
  }
});
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div
    v-else
    class="application-wizard"
  >
    <Wizard
      :steps="steps"
      :banner-title="t('epinio.applications.create.title')"
      :banner-title-subtext="t('epinio.applications.create.titleSubText')"
      :finish-mode="action"
      @cancel="cancel"
      @finish="saveOverride"
    >
      <template #basics>
        <AppInfo
          :application="value"
          :mode="mode"
          @change="update"
        ></AppInfo>
      </template>
      <template #source>
        <AppSource
          :application="value"
          :mode="mode"
          @change="updateSource"
        ></AppSource>
      </template>
      <template #services>
        <AppService
          :application="value"
          :mode="mode"
        ></AppService>
      </template>
      <template #progress>
        <AppProgress
          :application="value"
          :mode="mode"
        ></AppProgress>
      </template>
    </Wizard>
    <!-- <br><br>
    Debug<br>
    Mode: {{ mode }}<br>
    Value: {{ jsonValue }}<br>
    originalValue: {{ JSON.stringify(originalValue) }}<br>
    source: {{ JSON.stringify(source) }}<br> -->
  </div>
</template>

<style lang='scss' scoped>
.application-wizard {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
