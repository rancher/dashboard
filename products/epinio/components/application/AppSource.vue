<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '@/products/epinio/models/applications.class';
import LabeledInput from '@/components/form/LabeledInput.vue';

import LabeledSelect from '@/components/form/LabeledSelect.vue';
import FileSelector from '@/components/form/FileSelector.vue';
import RadioGroup from '@/components/form/RadioGroup.vue';

import { APPLICATION_SOURCE_TYPE } from '@/products/epinio/types';

interface Data {
  errors: string[],
  archive: {
    tarball: string,
    builderImage: string,
    defaultBuilderImage: boolean
  },
  containerUrl: any
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
    mode: {
      type:     String,
      required: true
    },
  },

  data() {
    return {
      errors: [],

      archive: {
        tarball:             '',
        builderImage:        DEFAULT_BUILD_PACK,
        fileName:            '',
        defaultBuilderImage: true
      },

      containerUrl: { url: undefined },

      types:        [{
        label: this.t('epinio.applications.steps.source.archive.label'),
        value: APPLICATION_SOURCE_TYPE.ARCHIVE
      }, {
        label: this.t('epinio.applications.steps.source.containerUrl.label'),
        value: APPLICATION_SOURCE_TYPE.CONTAINER_URL
      },
      ],
      type: APPLICATION_SOURCE_TYPE.ARCHIVE,
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
      switch (this.type) {
      case APPLICATION_SOURCE_TYPE.ARCHIVE:
        this.$emit('change', {
          type:         APPLICATION_SOURCE_TYPE.ARCHIVE,
          tarball:      this.archive.tarball,
          builderImage: this.archive.builderImage
        });
        break;
      case APPLICATION_SOURCE_TYPE.CONTAINER_URL:
        this.$emit('change', {
          type: APPLICATION_SOURCE_TYPE.CONTAINER_URL,
          url:      this.containerUrl.url,
        });
        break;
      }
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
        return !!this.containerUrl.url;
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
          v-model="containerUrl.url"
          :tooltip="t('epinio.applications.steps.source.containerUrl.url.tooltip')"
          :label="t('epinio.applications.steps.source.containerUrl.url.inputLabel')"
          @input="update"
        />
      </div>
    <!-- <br><br> -->
    <!-- Debug<br>
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
