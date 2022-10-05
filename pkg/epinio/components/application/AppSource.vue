<script lang="ts">
import Vue, { PropType } from 'vue';
import jsyaml from 'js-yaml';

import Application from '../../models/applications';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import FileSelector from '@shell/components/form/FileSelector.vue';
import GithubPicker from '@shell/components/form/GithubPicker.vue';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import { sortBy } from '@shell/utils/sort';
import { generateZip } from '@shell/utils/download';
import Collapse from '@shell/components/Collapse.vue';
import { APPLICATION_SOURCE_TYPE, EpinioApplicationChartResource, EPINIO_TYPES, EpinioInfo } from '../../types';
import { EpinioAppInfo } from './AppInfo.vue';

interface Archive{
  tarball: string,
  fileName: string
}

interface Container {
  url: string,
}

interface GitUrl {
  url: string,
  branch: string
}

interface GitHub {
  usernameOrOrg?: string,
  url: string
  commit: string,
}

interface BuilderImage {
  value: string,
  default: boolean,
}

interface Data {
  open: boolean,
  archive: Archive,
  container: Container,
  gitUrl: GitUrl,
  github: GitHub,
  builderImage: BuilderImage,
  types: any[],
  unSafeType: string, // APPLICATION_SOURCE_TYPE || { } from the select component
  APPLICATION_SOURCE_TYPE: typeof APPLICATION_SOURCE_TYPE
}

export interface EpinioAppSource {
  type: string // APPLICATION_SOURCE_TYPE,
  archive: Archive,
  container: Container,
  gitUrl: GitUrl,
  github: GitHub,
  builderImage: BuilderImage,
  appChart: string,
}

interface FileWithRelativePath extends File {
  // For some reason TS throws this as missing at transpile time .. so recreate it
   readonly webkitRelativePath: string;
}

const DEFAULT_BUILD_PACK = 'paketobuildpacks/builder:full';

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({

  components: {
    FileSelector,
    LabeledInput,
    LabeledSelect,
    RadioGroup,
    Collapse,
    GithubPicker
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
    info: {
      type:     Object as PropType<EpinioInfo>,
      default: null
    },
    mode: {
      type:     String,
      required: true
    },
  },

  data() {
    const defaultBuilderImage = this.info?.default_builder_image || DEFAULT_BUILD_PACK;
    const builderImage = this.source?.builderImage?.value || defaultBuilderImage;

    return {
      open: false,
      defaultBuilderImage,

      archive: {
        tarball:             this.source?.archive.tarball || '',
        fileName:            this.source?.archive.fileName || '',
      },

      container: { url: this.source?.container.url },

      gitUrl: {
        url:         this.source?.gitUrl.url || '',
        branch:      this.source?.gitUrl.branch || '',
        validGitUrl: false,
      },

      github: {
        usernameOrOrg: this.source?.github.usernameOrOrg || '',
        url:           this.source?.github.url || '',
        commit:        this.source?.github.commit || '',
      },

      builderImage: {
        value:   builderImage,
        default:  builderImage === defaultBuilderImage,
      },

      appChart: this.source?.appChart,

      types:        [{
        label: this.t('epinio.applications.steps.source.archive.label'),
        value: APPLICATION_SOURCE_TYPE.ARCHIVE
      }, {
        label: this.t('epinio.applications.steps.source.containerUrl.label'),
        value: APPLICATION_SOURCE_TYPE.CONTAINER_URL
      }, {
        label: this.t('epinio.applications.steps.source.folder.label'),
        value: APPLICATION_SOURCE_TYPE.FOLDER
      }, {
        label: this.t('epinio.applications.steps.source.gitUrl.label'),
        value: APPLICATION_SOURCE_TYPE.GIT_URL
      }, {
        label: this.t('epinio.applications.steps.source.gitHub.label'),
        value: APPLICATION_SOURCE_TYPE.GIT_HUB
      }],
      unSafeType: this.source?.type || APPLICATION_SOURCE_TYPE.FOLDER,
      APPLICATION_SOURCE_TYPE
    };
  },

  mounted() {
    if (!this.appChart) {
      Vue.set(this, 'appChart', this.appCharts[0].value);
    }
    this.update();
  },

  methods: {
    urlRule() {
      const gitRegex = /(git@|https?:\/\/)([a-zA-Z0-9\.\-_]+)(\/|:)([a-zA-Z0-9\-]+)\/([a-zA-Z0-9\-]+)/gm;

      if (!this.gitUrl.url) {
        return;
      }

      const evalUrl = () => {
        const result = gitRegex.exec(this.gitUrl.url);

        if (result && this.gitUrl.url === result[0]) {
          this.gitUrl.validGitUrl = true;
        } else {
          this.gitUrl.validGitUrl = false;

          return this.t('epinio.applications.steps.source.gitUrl.error.label');
        }
      };

      return evalUrl();
    },
    onFileSelected(file: File) {
      this.archive.tarball = file;
      this.archive.fileName = file.name;

      this.update();
    },

    onManifestFileSelected(file: string) {
      try {
        const parsed: any = jsyaml.load(file);

        if (parsed.origin?.container) {
          Vue.set(this, 'unSafeType', APPLICATION_SOURCE_TYPE.CONTAINER_URL);
          Vue.set(this.container, 'url', parsed.origin.container);
        } else if (parsed.origin.git?.url && parsed.origin.git?.revision) {
          Vue.set(this, 'unSafeType', APPLICATION_SOURCE_TYPE.GIT_URL);
          Vue.set(this.gitUrl, 'url', parsed.origin.git.url);
          Vue.set(this.gitUrl, 'branch', parsed.origin.git.revision);
        }
        if (parsed.configuration) {
          Vue.set(this, 'appChart', parsed.configuration.appchart);
        }

        const appInfo: EpinioAppInfo = {
          meta: {
            name:      parsed.name || '',
            namespace: this.namespaces?.[0]?.name || ''
          },
          configuration: {
            instances:   parsed.configuration.instances || 1,
            environment: parsed.configuration.environment || {},
            routes:      parsed.configuration.routes || []
          }
        };

        this.update();
        this.updateAppInfo(appInfo);
        this.updateConfigurations(parsed.configuration.configurations || []);
      } catch (e) {
        console.error('Failed to parse or process manifest: ', e); // eslint-disable-line no-console
      }
    },

    onFolderSelected(files: FileWithRelativePath | FileWithRelativePath[]) {
      const safeFiles = Array.isArray(files) ? files : [files];
      let folderName: string = '';

      // Determine parent folder name
      for (const f of safeFiles) {
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

      const filesToZip = safeFiles.reduce((res, f) => {
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
        builderImage: this.builderImage,
        appChart:     this.appChart,
        github:       this.github,
      });
    },

    updateAppInfo(info: EpinioAppInfo) {
      this.$emit('changeAppInfo', info);
    },

    updateConfigurations(configs: string[]) {
      this.$emit('changeAppConfig', configs);
    },

    onImageType(defaultImage: boolean) {
      if (defaultImage) {
        this.builderImage.value = this.defaultBuilderImage;
      }

      this.builderImage.default = defaultImage;

      this.update();
    },
    githubData({ repo, selectedAccOrOrg, commit }: {
      commit: string,
      selectedAccOrOrg: string,
      repo: string,
    }) {
      const url = `https://github.com/${ selectedAccOrOrg }/${ repo }`;

      if (url.length && selectedAccOrOrg.length) {
        this.github.usernameOrOrg = selectedAccOrOrg;
        this.github.url = url;
        this.github.commit = commit;

        this.update();
        this.$emit('valid', true);
      }
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
        return !!this.gitUrl.url && !!this.gitUrl.branch && !!this.builderImage.value && !!this.gitUrl.validGitUrl;
      case APPLICATION_SOURCE_TYPE.GIT_HUB:
        return !!this.github.usernameOrOrg && !!this.github.url && !!this.github.commit;
      }

      return false;
    },

    showBuilderImage() {
      return [
        APPLICATION_SOURCE_TYPE.ARCHIVE,
        APPLICATION_SOURCE_TYPE.FOLDER,
        APPLICATION_SOURCE_TYPE.GIT_URL,
        APPLICATION_SOURCE_TYPE.GIT_HUB,
      ].includes(this.type);
    },

    namespaces() {
      return sortBy(this.$store.getters['epinio/all'](EPINIO_TYPES.NAMESPACE), 'name');
    },

    appCharts() {
      return sortBy(this.$store.getters['epinio/all'](EPINIO_TYPES.APP_CHARTS), 'name').map((ap: EpinioApplicationChartResource) => ({
        value: ap.meta.name,
        label: `${ ap.meta.name } (${ ap.short_description })`
      }));
    },

    type() {
      // There's a bug in the select component which fires off the option ({ value, label}) instead of the value
      // (possibly `reduce` related). This the workaround
      return this.unSafeType.value || this.unSafeType;
    },
  }
});
</script>

<template>
  <div class="appSource">
    <div class="button-row source">
      <LabeledSelect
        v-model="unSafeType"
        data-testid="epinio_app-source_type"
        label="Source Type"
        :options="types"
        :mode="mode"
        :clearable="false"
        :reduce="(e) => e.value"
      />
      <FileSelector
        v-tooltip="t('epinio.applications.steps.source.manifest.tooltip')"
        data-testid="epinio_app-source_manifest"
        class="role-tertiary add mt-5"
        :label="t('epinio.applications.steps.source.manifest.button')"
        :mode="mode"
        :raw-data="false"
        @selected="onManifestFileSelected"
      />
    </div>

    <template v-if="type === APPLICATION_SOURCE_TYPE.ARCHIVE">
      <div class="spacer source">
        <h3>{{ t('epinio.applications.steps.source.archive.file.label') }}</h3>
        <div class="button-row">
          <LabeledInput
            v-model="archive.fileName"
            data-testid="epinio_app-source_archive_name"
            :disabled="true"
            :tooltip="t('epinio.applications.steps.source.archive.file.tooltip')"
            :label="t('epinio.applications.steps.source.archive.file.inputLabel')"
            :required="true"
          />
          <FileSelector
            data-testid="epinio_app-source_archive_file"
            class="role-tertiary add mt-5"
            :label="t('epinio.applications.steps.source.archive.file.button')"
            :mode="mode"
            :raw-data="true"
            :accept="'.zip, .tar, .gz, .bz2, .xz'"
            @selected="onFileSelected"
          />
        </div>
      </div>
    </template>
    <template v-else-if="type === APPLICATION_SOURCE_TYPE.FOLDER">
      <div class="spacer source">
        <h3>{{ t('epinio.applications.steps.source.folder.file.label') }}</h3>
        <div class="button-row">
          <LabeledInput
            v-model="archive.fileName"
            data-testid="epinio_app-source_folder_name"
            :disabled="true"
            :tooltip="t('epinio.applications.steps.source.folder.file.tooltip')"
            :label="t('epinio.applications.steps.source.folder.file.inputLabel')"
            :required="true"
          />
          <FileSelector
            data-testid="epinio_app-source_folder_file"
            class="role-tertiary add mt-5"
            :label="t('epinio.applications.steps.source.folder.file.button')"
            :mode="mode"
            :raw-data="true"
            :directory="true"
            @selected="onFolderSelected"
          />
        </div>
      </div>
    </template>
    <template v-else-if="type === APPLICATION_SOURCE_TYPE.CONTAINER_URL">
      <div class="spacer source">
        <h3>{{ t('epinio.applications.steps.source.containerUrl.url.label') }}</h3>
        <LabeledInput
          v-model="container.url"
          data-testid="epinio_app-source_container"
          :tooltip="t('epinio.applications.steps.source.containerUrl.url.tooltip')"
          :label="t('epinio.applications.steps.source.containerUrl.url.inputLabel')"
          :required="true"
          @input="update"
        />
      </div>
    </template>
    <template v-else-if="type === APPLICATION_SOURCE_TYPE.GIT_URL">
      <div class="spacer source">
        <h3>{{ t('epinio.applications.steps.source.gitUrl.url.label') }}</h3>
        <LabeledInput
          v-model="gitUrl.url"
          v-focus
          data-testid="epinio_app-source_git-url"
          :tooltip="t('epinio.applications.steps.source.gitUrl.url.tooltip')"
          :label="t('epinio.applications.steps.source.gitUrl.url.inputLabel')"
          :placeholder="'https://github.com/{user or org}/{repository}'"
          :required="true"
          :rules="[urlRule]"
          @delay="100"
          @input="update"
        />
      </div>
      <div class="spacer source">
        <h3>{{ t('epinio.applications.steps.source.gitUrl.branch.label') }}</h3>
        <LabeledInput
          v-model="gitUrl.branch"
          data-testid="epinio_app-source_git-branch"
          :tooltip="t('epinio.applications.steps.source.gitUrl.branch.tooltip')"
          :label="t('epinio.applications.steps.source.gitUrl.branch.inputLabel')"
          :required="true"
          :disabled="!gitUrl.validGitUrl"
          @input="update"
        />
      </div>
    </template>
    <template v-else-if="type === APPLICATION_SOURCE_TYPE.GIT_HUB">
      <GithubPicker @githubData="githubData" />
    </template>
    <Collapse :open.sync="open" :title="'Advanced Settings'" class="mt-30 mb-30 source">
      <template>
        <LabeledSelect
          v-model="appChart"
          data-testid="epinio_app-source_appchart"
          :label="t('epinio.applications.steps.source.archive.appchart.label')"
          :options="appCharts"
          :mode="mode"
          :clearable="false"
          :required="true"
          :tooltip="t('typeDescription.appcharts')"
          :reduce="(e) => e.value"
          @input="update"
        />
        <template v-if="showBuilderImage">
          <RadioGroup
            class="mt-20"
            name="defaultBuilderImage"
            data-testid="epinio_app-source_builder-select"
            :value="builderImage.default"
            :labels="[t('epinio.applications.steps.source.archive.builderimage.default'), t('epinio.applications.steps.source.archive.builderimage.custom')]"
            :options="[true, false]"
            :label-key="'epinio.applications.steps.source.archive.builderimage.label'"
            @input="onImageType"
          />
          <LabeledInput
            v-model="builderImage.value"
            data-testid="epinio_app-source_builder-value"
            :disabled="builderImage.default"
            :tooltip="t('epinio.applications.steps.source.archive.builderimage.tooltip')"
            :mode="mode"
            @input="update"
          />
        </template>
      </template>
    </Collapse>
  </div>
</template>

<style lang="scss" scoped>
.appSource {
  // max-width: 920px;

  .source {
    max-width: 700px;
  }

  .button-row {
    display: flex;
    align-items: center;
    .file-selector {
      margin-top: 0 !important;
      margin-left: 5px;
    }
  }

  .collapse {
    margin-left: -5px;
  }
}
.archive {
  display: flex;
  flex-direction: column;
}
</style>
