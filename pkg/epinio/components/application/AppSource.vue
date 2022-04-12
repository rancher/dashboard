<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '../../models/applications';
import LabeledInput from '@shell/components/form/LabeledInput.vue';

import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import FileSelector from '@shell/components/form/FileSelector.vue';
import RadioGroup from '@shell/components/form/RadioGroup.vue';

import { APPLICATION_SOURCE_TYPE } from '../../types';
import { generateZip } from '@shell/utils/download';

interface Archive{
  tarball: string,
  fileName: string,
}

interface Container {
  url: string,
}

interface GitUrl {
  url: string,
  branch: string
}

interface BuilderImage {
  value: string,
  default: boolean,
}

interface Data {
  archive: Archive,
  container: Container,
  gitUrl: GitUrl,
  builderImage: BuilderImage,
  types: any[],
  type: string, // APPLICATION_SOURCE_TYPE,
  APPLICATION_SOURCE_TYPE: typeof APPLICATION_SOURCE_TYPE
}

export interface EpinioAppSource {
  type: string // APPLICATION_SOURCE_TYPE,
  archive: Archive,
  container: Container,
  gitUrl: GitUrl,
  builderImage: BuilderImage,
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
        fileName:            this.source?.archive.fileName || '',
      },

      container: { url: this.source?.container.url },

      gitUrl: {
        url:    this.source?.gitUrl.url || '',
        branch: this.source?.gitUrl.branch || '',
      },

      builderImage: {
        value:   this.source?.builderImage?.value || DEFAULT_BUILD_PACK,
        default: this.source?.builderImage?.default !== undefined ? this.source.builderImage.default : true,
      },

      types:        [{
        label: this.t('epinio.applications.steps.source.folder.label'),
        value: APPLICATION_SOURCE_TYPE.FOLDER
      }, {
      //   label: this.t('epinio.applications.steps.source.archive.label'),
      //   value: APPLICATION_SOURCE_TYPE.ARCHIVE
      // }, {
        label: this.t('epinio.applications.steps.source.containerUrl.label'),
        value: APPLICATION_SOURCE_TYPE.CONTAINER_URL
      }, {
        label: this.t('epinio.applications.steps.source.gitUrl.label'),
        value: APPLICATION_SOURCE_TYPE.GIT_URL
      }],
      type: this.source?.type || APPLICATION_SOURCE_TYPE.FOLDER,
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

    onFolderSelected(files: any[]) {
      let folderName: string = '';

      // Determine parent folder name
      for (const f of files) {
        const paths = f.webkitRelativePath.split('/');

        if (paths.length > 1) {
          if (!folderName) {
            folderName = paths[0];
            continue;
          }
          if (folderName !== paths[0]) {
            folderName = '';
            break;
          }
        }
      }

      const filesToZip = files.reduce((res, f) => {
        let path = f.webkitRelativePath;

        if (folderName) {
          // Remove parent folder name
          const parts = path.split('/');

          parts.shift();
          path = parts.join('/');
        }

        res[path] = f;

        return res;
      }, {} as { [key: string]: any});

      generateZip(filesToZip).then((zip) => {
        Vue.set(this.archive, 'tarball', zip);
        Vue.set(this.archive, 'fileName', folderName || 'folder');

        this.update();

        // downloadFile('resources.zip', zip, 'application/zip');
      });
    },

    update() {
      this.$emit('change', {
        type:         this.type,
        archive:      this.archive,
        container:    this.container,
        gitUrl:       this.gitUrl,
        builderImage: this.builderImage
      });
    },

    onImageType(defaultImage: boolean) {
      if (defaultImage) {
        this.builderImage.value = DEFAULT_BUILD_PACK;
      }

      this.builderImage.default = defaultImage;

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
      case APPLICATION_SOURCE_TYPE.FOLDER:
        return !!this.archive.tarball && !!this.builderImage.value;
      case APPLICATION_SOURCE_TYPE.CONTAINER_URL:
        return !!this.container.url;
      case APPLICATION_SOURCE_TYPE.GIT_URL:
        return !!this.gitUrl.url && !!this.gitUrl.branch && !!this.builderImage.value;
      }

      return false;
    },

    showBuilderImage() {
      return [
        APPLICATION_SOURCE_TYPE.ARCHIVE,
        APPLICATION_SOURCE_TYPE.FOLDER,
        APPLICATION_SOURCE_TYPE.GIT_URL,
      ].includes(this.type);
    }
  }
});
</script>

<template>
  <div class="appSource">
    <LabeledSelect
      v-model="type"
      label="Source Type"
      :options="types"
      :mode="mode"
      :clearable="false"
      :reduce="(e) => e.value"
    />

    <template v-if="type === APPLICATION_SOURCE_TYPE.ARCHIVE">
      <div class="spacer archive">
        <h3>{{ t('epinio.applications.steps.source.archive.file.label') }}</h3>
        <LabeledInput
          v-model="archive.fileName"
          :disabled="true"
          :tooltip="t('epinio.applications.steps.source.archive.file.tooltip')"
          :label="t('epinio.applications.steps.source.archive.file.inputLabel')"
          :required="true"
        />
        <FileSelector
          class="role-tertiary add mt-5"
          :label="t('generic.readFromFile')"
          :mode="mode"
          :raw-data="true"
          @selected="onFileSelected"
        />
      </div>
    </template>
    <template v-else-if="type === APPLICATION_SOURCE_TYPE.FOLDER">
      <div class="spacer archive">
        <h3>{{ t('epinio.applications.steps.source.folder.file.label') }}</h3>
        <LabeledInput
          v-model="archive.fileName"
          :disabled="true"
          :tooltip="t('epinio.applications.steps.source.folder.file.tooltip')"
          :label="t('epinio.applications.steps.source.folder.file.inputLabel')"
          :required="true"
        />
        <FileSelector
          class="role-tertiary add mt-5"
          :label="t('generic.readFromFolder')"
          :mode="mode"
          :raw-data="true"
          :directory="true"
          :multiple="true"
          @selected="onFolderSelected"
        />
      </div>
    </template>
    <template v-else-if="type === APPLICATION_SOURCE_TYPE.CONTAINER_URL">
      <div class="spacer archive">
        <h3>{{ t('epinio.applications.steps.source.containerUrl.url.label') }}</h3>
        <LabeledInput
          v-model="container.url"
          :tooltip="t('epinio.applications.steps.source.containerUrl.url.tooltip')"
          :label="t('epinio.applications.steps.source.containerUrl.url.inputLabel')"
          :required="true"
          @input="update"
        />
      </div>
    </template>
    <template v-else-if="type === APPLICATION_SOURCE_TYPE.GIT_URL">
      <div class="spacer archive">
        <h3>{{ t('epinio.applications.steps.source.gitUrl.url.label') }}</h3>
        <LabeledInput
          v-model="gitUrl.url"
          :tooltip="t('epinio.applications.steps.source.gitUrl.url.tooltip')"
          :label="t('epinio.applications.steps.source.gitUrl.url.inputLabel')"
          :required="true"
          @input="update"
        />
      </div>
      <div class="spacer archive">
        <h3>{{ t('epinio.applications.steps.source.gitUrl.branch.label') }}</h3>
        <LabeledInput
          v-model="gitUrl.branch"
          :tooltip="t('epinio.applications.steps.source.gitUrl.branch.tooltip')"
          :label="t('epinio.applications.steps.source.gitUrl.branch.inputLabel')"
          :required="true"
          @input="update"
        />
      </div>
      <!-- <br><br>
      Debug<br>
      Mode: {{ mode }}<br>
      Value: {{ JSON.stringify(value) }}<br>
      initialModel: {{ JSON.stringify(initialModel) }}<br> -->
    </template>
    <template v-if="showBuilderImage">
      <div class="spacer">
        <RadioGroup
          name="defaultBuilderImage"
          :value="builderImage.default"
          :labels="[t('epinio.applications.steps.source.archive.builderimage.default'), t('epinio.applications.steps.source.archive.builderimage.custom')]"
          :options="[true, false]"
          :label-key="'epinio.applications.steps.source.archive.builderimage.label'"
          @input="onImageType"
        />
        <LabeledInput
          v-model="builderImage.value"
          :disabled="builderImage.default"
          :tooltip="t('epinio.applications.steps.source.archive.builderimage.tooltip')"
          :mode="mode"
          @input="update"
        />
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.appSource {
  max-width: 500px;
}
.archive {
  display: flex;
  flex-direction: column;
  .file-selector {
        align-self: end;
  }
}
</style>
