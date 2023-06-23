<script lang="ts">
import Vue, { PropType } from 'vue';
import jsyaml from 'js-yaml';

import Application from '../../models/applications';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import FileSelector from '@shell/components/form/FileSelector.vue';
import GitPicker from '@shell/components/form/GitPicker.vue';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import { sortBy } from '@shell/utils/sort';
import { generateZip } from '@shell/utils/download';
import Collapse from '@shell/components/Collapse.vue';
import {
  APPLICATION_SOURCE_TYPE, EpinioApplicationChartResource, EPINIO_TYPES, EpinioInfo, AppSourceArchive, AppSourceContainer, AppSourceGit, AppSourceGitUrl, AppSourceBuilderImage, EpinioAppSource, GitAPIData
} from '../../types';
import { EpinioAppInfo } from './AppInfo.vue';
import { _EDIT } from '@shell/config/query-params';
import { AppUtils } from '../../utils/application';

const GIT_BASE_URL = {
  [APPLICATION_SOURCE_TYPE.GIT_HUB]: 'https://github.com',
  [APPLICATION_SOURCE_TYPE.GIT_LAB]: 'https://gitlab.com',
};

export const EPINIO_APP_MANIFEST = 'manifest';

interface Data {
  open: boolean,
  archive: AppSourceArchive,
  container: AppSourceContainer,
  git: AppSourceGit,
  gitUrl: AppSourceGitUrl,
  builderImage: AppSourceBuilderImage,
  types: any[],
  type: APPLICATION_SOURCE_TYPE ;// || { } from the select component
  APPLICATION_SOURCE_TYPE: typeof APPLICATION_SOURCE_TYPE
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
    GitPicker
  },

  props: {
    application: {
      type:     Object as PropType<Application>,
      required: true
    },
    source: {
      type:    Object as PropType<EpinioAppSource>,
      default: null
    },
    info: {
      type:    Object as PropType<EpinioInfo>,
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
      open:  false,
      valid: this.validate(),
      defaultBuilderImage,

      archive: {
        tarball:  this.source?.archive?.tarball || '',
        fileName: this.source?.archive?.fileName || '',
      },

      container: { url: this.source?.container?.url },

      gitUrl: {
        url:         this.source?.gitUrl?.url || '',
        branch:      this.source?.gitUrl?.branch || '',
        validGitUrl: false,
      },

      git: {
        usernameOrOrg: this.source?.git?.usernameOrOrg || '',
        repo:          this.source?.git?.repo || '',
        commit:        this.source?.git?.commit || '',
        branch:        this.source?.git?.branch || '',
        url:           this.source?.git?.url || '',
        sourceData:    this.source?.git?.sourceData || {
          repos:    [],
          branches: [],
          commits:  []
        }
      },

      gitSkipTypeReset: false,

      builderImage: {
        value:   builderImage,
        default: builderImage === defaultBuilderImage,
      },

      appChart: this.source?.appChart,

      types: Object.values(APPLICATION_SOURCE_TYPE).map((value) => ({
        label: this.t(`epinio.applications.steps.source.${ value }.label`),
        value
      })),

      type: this.source?.type || APPLICATION_SOURCE_TYPE.FOLDER,
      APPLICATION_SOURCE_TYPE,
      EDIT: _EDIT
    };
  },

  mounted() {
    if (!this.appChart) {
      if (this.appCharts[0]?.value) {
        Vue.set(this, 'appChart', this.appCharts[0]?.value);
      } else {
        Vue.set(this, 'appChart', this.appCharts[0]);
      }
    }

    this.update();
  },

  methods: {
    urlRule() {
      const gitRegex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gm;

      if (!this.gitUrl.url) {
        return;
      }

      const evalUrl = () => {
        const result = gitRegex.exec(this.gitUrl.url);

        if (result && this.gitUrl.url === result[0]) {
          this.gitUrl.validGitUrl = true;
        } else {
          this.gitUrl.validGitUrl = false;

          return this.t('epinio.applications.steps.source.git_url.error.label');
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

        const type = AppUtils.getManifestSourceType(parsed.origin);

        this.gitSkipTypeReset = true;
        Vue.set(this, 'type', type);

        switch (type) {
        case APPLICATION_SOURCE_TYPE.CONTAINER_URL:
          Vue.set(this.container, 'url', parsed.origin.container);
          break;
        case APPLICATION_SOURCE_TYPE.GIT_URL:
          Vue.set(this.gitUrl, 'url', parsed.origin.git.url);
          Vue.set(this.gitUrl, 'branch', parsed.origin.git.revision);
          break;
        case APPLICATION_SOURCE_TYPE.GIT_HUB:
        case APPLICATION_SOURCE_TYPE.GIT_LAB:
          Vue.set(this, 'git', AppUtils.getGitData(parsed.origin.git));
          break;
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
            configurations: parsed.configuration?.configurations as string[] || [],
            instances:      parsed.configuration.instances || 1,
            environment:    parsed.configuration.environment || {},
            settings:       parsed.configuration?.settings || {},
            routes:         parsed.configuration.routes || []
          }
        };

        this.$router.applyQuery({ from: EPINIO_APP_MANIFEST });
        this.update();
        this.updateAppInfo(appInfo);
        this.updateConfigurations(parsed.configuration.configurations || []);
      } catch (e) {
        console.error('Failed to parse or process manifest: ', e); // eslint-disable-line no-console
      }
    },

    onFolderSelected(files: FileWithRelativePath | FileWithRelativePath[]) {
      const safeFiles = Array.isArray(files) ? files : [files];
      let folderName = '';

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
        git:          this.git,
      });
      this.valid = this.validate();
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

    gitUpdate({
      repo, selectedAccOrOrg, branch, commit, sourceData
    }: {
      commit: string,
      selectedAccOrOrg: string,
      repo: { id?: string, name: string },
      branch: string,
      sourceData: GitAPIData
    }) {
      if (!!selectedAccOrOrg && !!repo && !!commit && !!branch) {
        const url = `${ GIT_BASE_URL[this.type as APPLICATION_SOURCE_TYPE.GIT_HUB | APPLICATION_SOURCE_TYPE.GIT_LAB] }/${ selectedAccOrOrg }/${ repo.name }`;

        this.git.usernameOrOrg = selectedAccOrOrg;
        this.git.url = url;
        this.git.commit = commit;
        this.git.branch = branch;
        this.git.repo = repo;
        this.git.sourceData = sourceData;

        this.update();
        this.$emit('valid', true);
      } else {
        this.update();
        this.$emit('valid', false);
      }
    },

    validate() {
      switch (this.type) {
      case APPLICATION_SOURCE_TYPE.ARCHIVE:
      case APPLICATION_SOURCE_TYPE.FOLDER: {
        return !!this.archive.tarball && !!this.builderImage.value;
      }
      case APPLICATION_SOURCE_TYPE.CONTAINER_URL:
        return !!this.container.url;
      case APPLICATION_SOURCE_TYPE.GIT_URL:
        return !!this.gitUrl.url && !!this.gitUrl.branch && !!this.builderImage.value && !!this.gitUrl.validGitUrl;
      case APPLICATION_SOURCE_TYPE.GIT_HUB:
      case APPLICATION_SOURCE_TYPE.GIT_LAB:
        return !!this.git.usernameOrOrg && !!this.git.url && !!this.git.repo && !!this.git.branch && !!this.git.commit;
      }
    }
  },

  watch: {
    type() {
      // If we don't skip reseting the git type... we lose changes from loaded manifests
      if (this.gitSkipTypeReset) {
        this.gitSkipTypeReset = false;
      } else {
        this.git = {};
      }

      this.update();
    },

    valid(neu) {
      this.$emit('valid', neu);
    }
  },

  computed: {
    showBuilderImage() {
      return [
        APPLICATION_SOURCE_TYPE.ARCHIVE,
        APPLICATION_SOURCE_TYPE.FOLDER,
        APPLICATION_SOURCE_TYPE.GIT_URL,
        APPLICATION_SOURCE_TYPE.GIT_HUB,
        APPLICATION_SOURCE_TYPE.GIT_LAB,
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

    gitSource() {
      return {
        type:             this.type,
        selectedAccOrOrg: this.git.usernameOrOrg,
        selectedRepo:     this.git.repo,
        selectedBranch:   this.git.branch,
        selectedCommit:   { sha: this.git.commit }
      };
    }
  }
});
</script>

<template>
  <div class="appSource">
    <div class="button-row source">
      <LabeledSelect
        v-model="type"
        data-testid="epinio_app-source_type"
        label="Source Type"
        :options="types"
        :mode="mode"
        :clearable="false"
      />
      <FileSelector
        v-clean-tooltip="t('epinio.applications.steps.source.manifest.tooltip')"
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
        <h3>{{ t('epinio.applications.steps.source.container_url.url.label') }}</h3>
        <LabeledInput
          v-model="container.url"
          data-testid="epinio_app-source_container"
          :tooltip="t('epinio.applications.steps.source.container_url.url.tooltip')"
          :label="t('epinio.applications.steps.source.container_url.url.inputLabel')"
          :required="true"
          @input="update"
        />
      </div>
    </template>
    <template v-else-if="type === APPLICATION_SOURCE_TYPE.GIT_URL">
      <div class="spacer source">
        <h3>{{ t('epinio.applications.steps.source.git_url.url.label') }}</h3>
        <LabeledInput
          v-model="gitUrl.url"
          v-focus
          data-testid="epinio_app-source_git-url"
          :tooltip="t('epinio.applications.steps.source.git_url.url.tooltip')"
          :label="t('epinio.applications.steps.source.git_url.url.inputLabel')"
          :placeholder="'https://github.com/{user or org}/{repository}'"
          :required="true"
          :rules="[urlRule]"
          @delay="100"
          @input="update"
        />
      </div>
      <div class="spacer source">
        <h3>{{ t('epinio.applications.steps.source.git_url.branch.label') }}</h3>
        <LabeledInput
          v-model="gitUrl.branch"
          data-testid="epinio_app-source_git-branch"
          :tooltip="t('epinio.applications.steps.source.git_url.branch.tooltip')"
          :label="t('epinio.applications.steps.source.git_url.branch.inputLabel')"
          :required="true"
          :disabled="!gitUrl.validGitUrl"
          @input="update"
        />
      </div>
    </template>
    <template v-else>
      <GitPicker
        :value="gitSource"
        :type="type"
        @change="gitUpdate"
      />
    </template>
    <Collapse
      :open.sync="open"
      :title="'Advanced Settings'"
      class="pt-30 pb-30 source"
    >
      <template>
        <!-- Unable to change app chart of active app, so disable -->
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
          :disabled="mode === EDIT"
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
