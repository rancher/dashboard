<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '@/products/epinio/models/applications.class';
import CreateEditView from '@/mixins/create-edit-view';
import Loading from '@/components/Loading.vue';
import NameNsDescription from '@/components/form/NameNsDescription.vue';
// import FileSelector from '@/components/form/FileSelector.vue';
import CruResource from '@/components/CruResource.vue';

import { EPINIO_TYPES } from '@/products/epinio/types';
import { exceptionToErrorsArray } from '@/utils/error';
import { isEmpty } from '@/utils/object';

interface Data {
  errors: string[],
  tarball?: string,
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  // TODO: RC View/Edit ... Refresh on page ... we won't have the namespace so fails

  components: {
    Loading,
    CruResource,
    NameNsDescription,
    // FileSelector,
  },

  props: {
    value: {
      type:     Object as PropType<Application>,
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
      tarBall: null
    };
  },

  computed: {
    namespaces() {
      // TODO: RC sort
      return this.$store.getters['epinio/all'](EPINIO_TYPES.NAMESPACE);
    },
    valid() {
      return false; // TODO: RC
    },
  },

  methods: {
    onFileSelected(value: { name: string, value: any }) {
      const file = this.$refs.file.files[0];
      // lastModified: 1633451677134
      // lastModifiedDate: Tue Oct 05 2021 17:34:37 GMT+0100 (British Summer Time) {}
      // name: "sample-app.tar.gz"
      // size: 256
      // type: "application/gzip"
      // webkitRelativePath: ""

      this.tarball = file;

      // const { name: fileName, value: fileContent, ...others } = value;

      // console.log(fileName, fileContent, others); // eslint-disable-line no-console
      // this.tarball = value;
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
            const blobuid = await this.value.storeArchive(this.tarball);
            const { image, stage } = await this.value.stage(blobuid);

            this.value.showStagingLog(stage.id);
            await this.value.waitForStaging(stage.id);
            await this.value.deploy(stage.id, image);
          } else {
            throw new Error('Not implemented');
          }

          //  this.done(); // TODO: RC nav to apps?
          buttonDone(true);
        } catch (err) {
          console.error(err);// eslint-disable-line no-console
          throw err;
        } finally {
          // TODO: RC `find` DOESN'T WORK... id doesn't contain namespace
          this.$store.dispatch('epinio/findAll', { type: this.type, opt: { force: true } });
          // await this.$dispatch('findAll', { type: this.type, opt: { force: true } });
        }
      } catch (e) {
        this.errors = exceptionToErrorsArray(e);
        buttonDone(false);
      }
    }
  }
});
</script>

<template>
  <Loading v-if="!value" />
  <CruResource
    v-else
    :mode="mode"
    :resource="value"
    :done-route="doneRoute"
    :can-yaml="false"
    :errors="errors"
    @error="e=>errors = e"
    @finish="saveOverride"
    @cancel="done"
  >
    <div>
      <!-- TODO: RC switches do odd value on refresh -->
      <NameNsDescription
        name-key="name"
        namespace-key="namespace"
        :namespaces-override="namespaces"
        :description-hidden="true"
        :value="value"
        :mode="mode"
        class="mt-10"
      />
      <!-- TODO: Switch back -->
      <input
        id="file"
        ref="file"
        type="file"
        @change="onFileSelected"
      />

      <!-- <FileSelector
          class="role-tertiary add mt-5"
          :label="t('generic.readFromFile')"
          :include-file-name="true"
          :mode="mode"
          :read-as-data-url="true"
          @selected="onFileSelected"
        /> -->

      <br><br>
      Debug<br>
      Mode: {{ mode }}<br>
      Value: {{ JSON.stringify(value) }}<br>
      originalValue: {{ JSON.stringify(originalValue) }}<br>
    </div>
  </CruResource>
</template>
