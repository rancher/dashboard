<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '@/products/epinio/models/applications';
import LabeledInput from '@/components/form/LabeledInput.vue';

import LabeledSelect from '@/components/form/LabeledSelect.vue';
import FileSelector from '@/components/form/FileSelector.vue';
import RadioGroup from '@/components/form/RadioGroup.vue';

import { APPLICATION_SOURCE_TYPE } from '@/products/epinio/types';

interface Archive{
  tarball: string,
  builderImage: string,
  fileName: string,
  defaultBuilderImage: boolean
}

interface Container {
  url: string,
}

interface Data {
  archive: Archive,
  container: Container,
  types: any[],
  type: string // APPLICATION_SOURCE_TYPE,
  APPLICATION_SOURCE_TYPE: typeof APPLICATION_SOURCE_TYPE
}

export interface EpinioAppSource {
  type: string // APPLICATION_SOURCE_TYPE,
  archive: Archive,
  container: Container,
}

const DEFAULT_BUILD_PACK = 'paketobuildpacks/builder:full';

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({

  components: {
    FileSelector,
    LabeledInput,
    LabeledSelect,
    RadioGroup
  },

  props: {
    application: {
      type:     Object as PropType<Application>,
      required: true
    },
    source: {
      type:     Object as PropType<EpinioAppSource>,
      default: null
    },
    mode: {
      type:     String,
      required: true
    },
  },

  data() {
    return {
      archive: {
        tarball:             this.source?.archive.tarball || '',
        builderImage:        this.source?.archive.builderImage || DEFAULT_BUILD_PACK,
        fileName:            this.source?.archive.fileName || '',
        defaultBuilderImage: this.source?.archive.defaultBuilderImage !== undefined ? this.source.archive.defaultBuilderImage : true,
      },

      container: { url: this.source?.container.url },

      types:        [{
        label: this.t('epinio.applications.steps.source.archive.label'),
        value: APPLICATION_SOURCE_TYPE.ARCHIVE
      }, {
        label: this.t('epinio.applications.steps.source.containerUrl.label'),
        value: APPLICATION_SOURCE_TYPE.CONTAINER_URL
      },
      ],
      type: this.source?.type || APPLICATION_SOURCE_TYPE.ARCHIVE,
      APPLICATION_SOURCE_TYPE
    };
  },

  mounted() {
    this.update();
  },

  methods: {
    onFileSelected(file: File) {
      this.archive.tarball = file;
      this.archive.fileName = file.name;

      this.update();
    },

    update() {
      this.$emit('change', {
        type:      this.type,
        archive:   this.archive,
        container: this.container
      });
    },

    onImageType(defaultBuilderImage: string) {
      if (defaultBuilderImage) {
        this.archive.builderImage = DEFAULT_BUILD_PACK;
      }
      this.archive.defaultBuilderImage = defaultBuilderImage;

      this.update();
    }
  },

  watch: {
    type() {
      this.update();
    },

    valid() {
      this.$emit('valid', this.valid);
    }
  },

  computed: {
    valid() {
      switch (this.type) {
      case APPLICATION_SOURCE_TYPE.ARCHIVE:
        return !!this.archive.tarball && !!this.archive.builderImage;
      case APPLICATION_SOURCE_TYPE.CONTAINER_URL:
        return !!this.container.url;
      }

      return false;
    }
  }
});
</script>

<template>
  <div class="col span-6">
    <LabeledSelect
      v-model="type"
      label="Source Type"
      :options="types"
      :mode="mode"
      :clearable="false"
      :reduce="(e) => e.value"
    />

    <div v-if="type === APPLICATION_SOURCE_TYPE.ARCHIVE">
      <div class="spacer archive">
        <h3>{{ t('epinio.applications.steps.source.archive.file.label') }}</h3>
        <LabeledInput
          v-model="archive.fileName"
          :disabled="true"
          :tooltip="t('epinio.applications.steps.source.archive.file.tooltip')"
          :label="t('epinio.applications.steps.source.archive.file.inputLabel')"
        />
        <FileSelector
          class="role-tertiary add mt-5"
          :label="t('generic.readFromFile')"
          :mode="mode"
          :raw-data="true"
          @selected="onFileSelected"
        />
      </div>
      <div class="spacer">
        <RadioGroup
          name="defaultBuilderImage"
          :value="archive.defaultBuilderImage"
          :labels="[t('epinio.applications.steps.source.archive.builderimage.default'), t('epinio.applications.steps.source.archive.builderimage.custom')]"
          :options="[true, false]"
          :label-key="'epinio.applications.steps.source.archive.builderimage.label'"
          @input="onImageType"
        />
        <LabeledInput
          v-model="archive.builderImage"
          :disabled="archive.defaultBuilderImage"
          :tooltip="t('epinio.applications.steps.source.archive.builderimage.tooltip')"
          :mode="mode"
          @input="update"
        />
      </div>
    </div>
    <div v-if="type === APPLICATION_SOURCE_TYPE.CONTAINER_URL">
      <div class="spacer archive">
        <h3>{{ t('epinio.applications.steps.source.containerUrl.url.label') }}</h3>
        <LabeledInput
          v-model="container.url"
          :tooltip="t('epinio.applications.steps.source.containerUrl.url.tooltip')"
          :label="t('epinio.applications.steps.source.containerUrl.url.inputLabel')"
          @input="update"
        />
      </div>
      <!-- <br><br>
      Debug<br>
      Mode: {{ mode }}<br>
      Value: {{ JSON.stringify(value) }}<br>
      originalValue: {{ JSON.stringify(originalValue) }}<br> -->
    </div>
  </div>
</template>

<style lang="scss" scoped>
.archive {
  display: flex;
  flex-direction: column;
  .file-selector {
        align-self: end;
  }
}
</style>
