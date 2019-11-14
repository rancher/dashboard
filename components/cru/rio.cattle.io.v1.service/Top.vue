<script>
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import Ports from '@/components/cru/rio.cattle.io.v1.service/Ports';
import GithubPicker from '@/components/GithubPicker';

const BUILD_MODES = {
  image:  'Use an existing Docker image',
  github: 'Build from Dockerfile in a GitHub repo',
  git:    'Build from Dockerfile in another repository'
};

const IMAGE_PULL_POLICIES = {
  Always:       'Always pull',
  IfNotPresent: 'Pull if not present on the node',
  Never:        'Never pull',
};

export default {
  components: {
    NameNsDescription, LabeledInput, LabeledSelect, Ports, GithubPicker,
  },

  props: {
    isDemo: {
      type:    Boolean,
      default: false
    },
    isSidecar: {
      type:    Boolean,
      default: false
    },
    nameResource: {
      type:     Object,
      required: true,
    },
    spec: {
      type:     Object,
      required: true,
    },
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    },
  },
  inject: ['realMode'],
  data() {
    const spec = this.spec;
    const buildImage = !!(spec && spec.build && spec.build.repo);
    const hasGithub = this.$store.getters['auth/isGithub'];

    let buildMode = 'image';
    let image, build;

    if ( hasGithub && buildImage && spec.build.repo.startsWith('https://github.com/' && !this.isDemo) ) {
      buildMode = 'github';
      build = spec.build;
      spec.build.branch = spec.build.branch || 'master';
      spec.build.dockerfile = spec.build.dockerfile || '/Dockerfile';
    } else if ( buildImage ) {
      buildMode = 'git';
      build = spec.build;
    } else {
      image = spec.image;
    }

    let scaleInput = spec.replicas;
    let scaleMode = 'fixed';
    const autoscale = spec.autoscale || {};

    if ( autoscale.minReplicas && autoscale.maxReplicas ) {
      scaleInput = `${ autoscale.minReplicas } - ${ autoscale.maxReplicas }`;
      scaleMode = 'auto';
    }

    build = build || {};

    return {
      hasGithub,
      buildMode,
      image,
      build,
      scaleInput,
      scaleMode,
      buildModeLabels: BUILD_MODES,
    };
  },

  computed: {
    imagePullPolicyChoices() {
      return Object.keys(IMAGE_PULL_POLICIES).map((k) => {
        return {
          label:    IMAGE_PULL_POLICIES[k],
          value:    k,
        };
      });
    },

    buildModeOptions() {
      const githubDisabled = !this.$store.getters['auth/isGithub'];

      return Object.keys(BUILD_MODES).map((k) => {
        return {
          label:    BUILD_MODES[k],
          value:    k,
          disabled: k === 'github' && githubDisabled,
          tooltip:  k === 'github' && githubDisabled ? 'You did not log in with GitHub' : null,
        };
      });
    },
  },

  watch: {
    buildMode() {
      this.update();
    },
  },

  methods: {
    update() {
      switch (this.buildMode) {
      case 'image':
        delete this.spec.build;
        this.spec.image = this.image;
        break;
      case 'github':
      case 'git':
        delete this.spec.image;
        this.spec.build = this.build || {};
      }
    },

    updateGeneratedName() {
      const metadata = this.nameResource;
      const spec = this.spec;

      metadata.generateName = `${ spec.app }-`;
    },

    updateScale(neu) {
      // Scale
      const parts = (neu || '').split(/\s*-\s*/, 2);

      if ( parts.length === 2 ) {
        let min = parseInt(parts[0], 10) || 0;
        let max = parseInt(parts[1], 10) || 0;

        if ( min < 0 ) {
          min = 0;
        }

        if ( max < min ) {
          max = min;
        }

        this.spec.autoscale = this.spec.autoscale || {};
        this.spec.autoscale.minReplicas = min;
        this.spec.autoscale.maxReplicas = max;
        delete this.spec.replicas;
        this.scaleMode = 'auto';
      } else {
        let parsed = parseInt(neu, 10);

        if ( isNaN(parsed) ) {
          parsed = 1;
        }

        this.spec.replicas = parsed;
        delete this.spec.autoscale;
        this.scaleMode = 'fixed';
      }
    },
  }
};
</script>
<template>
  <div>
    <NameNsDescription
      :value="value"
      :mode="mode"
      :name-label="isSidecar ? 'Container Name' : 'Service Name'"
      :extra-column="!isSidecar"
    >
      <template v-if="isSidecar" #name>
        <LabeledInput
          key="sidecarName"
          v-model="nameResource.name"
          :mode="mode"
          label="Container Name"
          :required="true"
        />
      </template>
      <template v-else #name>
        <LabeledInput
          key="appName"
          v-model="spec.app"
          :mode="mode"
          label="App Name"
          :required="true"
          :disabled="mode !== 'create'"
          @input="updateGeneratedName"
        />
      </template>
      <template v-if="!isSidecar" #extra>
        <LabeledInput
          key="scale"
          v-model="scaleInput"
          :mode="mode"
          :label="scaleMode === 'fixed' ? 'Scale' : 'Scale Between'"
          placeholder="e.g. 1 or 1-10"
          @input="updateScale"
        >
          <template #suffix>
            <div class="addon">
              {{ scaleMode === 'fixed' && spec.replicas === 1 ? 'Pod' : 'Pods' }}
            </div>
          </template>
        </LabeledInput>
      </template>
      <template v-if="realMode === 'edit' || realMode === 'stage'" #namespace>
        <LabeledInput
          key="version"
          v-model="spec.version"
          :mode="mode"
          label="Version"
          @input="updateGeneratedName"
        />
      </template>
    </NameNsDescription>
    <div class="spacer"></div>
    <h4>Image</h4>
    <div class="row">
      <div class="col span-12">
        <div v-if="mode === 'view'">
          {{ buildModeLabels[buildMode] }}
        </div>
        <div v-else>
          <label v-for="opt in buildModeOptions" :key="opt.value" v-tooltip="opt.tooltip" class="radio" :class="{disabled: opt.disabled}">
            <input v-model="buildMode" type="radio" :value="opt.value" :disabled="opt.disabled" />
            {{ opt.label }}
          </label>
        </div>
      </div>
    </div>

    <div v-if="buildMode === 'image'" class="row">
      <div class="col span-6">
        <LabeledInput
          v-model="spec.image"
          :mode="mode"
          label="Image"
          placeholder="e.g. nginx:latest"
          :required="true"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="spec.imagePullPolicy"
          :mode="mode"
          :options="imagePullPolicyChoices"
          label="Pull Policy"
          placeholder="Select a pull policy..."
        />
      </div>
    </div>

    <div v-if="buildMode === 'github'" class="row">
      <div class="col span-12">
        <GithubPicker
          v-model="spec.build"
          file-pattern="Dockerfile"
          preferred-file="Dockerfile"
          file-key="dockerfile"
        />
      </div>
    </div>

    <div v-if="buildMode === 'git'">
      <div class="row">
        <div class="col span-6">
          <LabeledInput v-model="build.repo" :mode="mode" label="Repo URL" :required="true" @input="update" />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="build.branch" :mode="mode" label="Branch" @input="update" />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput v-model="build.dockerfile" :mode="mode" label="Path to Dockerfile" @input="update" />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="build.revision" :mode="mode" label="Commit ID or Tag" @input="update" />
        </div>
      </div>
    </div>

    <div v-if="buildMode === 'git' || buildMode === 'github'" class="row">
      <div class="col span-12">
        <label v-if="buildMode === 'github'" class="checkbox">
          <input v-model="spec.build.pr" type="checkbox">
          Pull Request Workflow
          <i v-tooltip="'Creates a brand new service for each pull request created, using this service as a template.'" class="icon icon-info" />
        </label>
        <label class="checkbox"><input v-model="spec.build.tag" type="checkbox"> Build on tag</label>
      </div>
    </div>

    <div class="row">
      <Ports
        class="col span-12"
        :spec="spec"
        :name-resource="nameResource"
        :is-sidecar="isSidecar"
        :mode="mode"
        :pad-left="false"
      />
    </div>
  </div>
</template>
