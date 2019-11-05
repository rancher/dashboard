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

const imagePullPolicyChoices = [
  { value: 'Always', label: 'Always pull' },
  { value: 'IfNotPresent', label: 'Pull if not present on the node' },
  { value: 'Never', label: 'Never pull' },
];

export default {
  components: {
    NameNsDescription, LabeledInput, LabeledSelect, Ports, GithubPicker
  },

  props: {
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
    }
  },

  data() {
    const spec = this.spec;
    const buildImage = !!(spec && spec.build && spec.build.repo);
    const hasGithub = this.$store.getters['auth/isGithub'];

    let buildMode = 'image';
    let image, build;

    if ( hasGithub && buildImage && spec.build.repo.startsWith('https://github.com/') ) {
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

    build = build || {};

    return {
      hasGithub,
      buildMode,
      image,
      build,
    };
  },

  computed: {
    imagePullPolicyChoices() {
      return imagePullPolicyChoices;
    },

    buildModeLabels() {
      return BUILD_MODES;
    },

    buildModeOptions() {
      return Object.keys(BUILD_MODES).map((k) => {
        return { label: BUILD_MODES[k], value: k };
      });
    }
  },

  watch: {
    buildMode(mode) {
      this.update();
    }
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
    }
  }
};
</script>
<template>
  <div>
    <NameNsDescription
      :value="value"
      :mode="mode"
      :name-label="isSidecar ? 'Container Name' : 'Service Name'"
      :three-column="!isSidecar"
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
      <template v-if="!isSidecar" #right>
        <LabeledInput
          key="scale"
          v-model.number="spec.replicas"
          :mode="mode"
          type="number"
          min="0"
          label="Scale"
        />
      </template>
      <template v-if="mode === 'edit'" #namespace>
        <LabeledInput
          key="version"
          v-model="spec.version"
          :mode="mode"
          label="Version"
          :required="true"
        />
      </template>
    </NameNsDescription>

    <h4>Image</h4>
    <div class="row">
      <div class="col span-4">
        <div v-if="mode === 'view'">
          {{ buildModeLabels[buildMode] }}
        </div>
        <div v-else>
          <div v-for="opt in buildModeOptions" :key="opt.value">
            <label class="radio" :class="{disabled: opt.value === 'github' && !hasGithub}">
              <input v-model="buildMode" type="radio" :value="opt.value" :disabled="opt.value === 'github ' && !hasGithub" />
              {{ opt.label }}
            </label>
          </div>
        </div>
      </div>

      <div v-if="buildMode === 'image'" class="col span-8">
        <div class="row">
          <div class="col span-6">
            <LabeledInput v-model="spec.image" :mode="mode" label="Image" :required="true" />
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
      </div>

      <div v-if="buildMode === 'github'" class="col span-12">
        <GithubPicker v-model="spec.build" file-key="dockefile" />
      </div>

      <div v-if="buildMode === 'git'" class="col span-8">
        <LabeledInput v-model="build.repo" :mode="mode" label="Repo URL" :required="true" @input="update" />
        <LabeledInput v-model="build.branch" :mode="mode" label="Branch" @input="update" />
        <LabeledInput v-model="build.revision" :mode="mode" label="Revision" @input="update" />
        <LabeledInput v-model="build.dockerfile" :mode="mode" label="Dockerfile" @input="update" />
      </div>
    </div>

    <div v-if="buildMode === 'git' || buildMode === 'github'" class="row">
      <div class="col span-12">
        <label v-if="buildMode === 'github'" v-tooltip="'Create an entire new service for each pull request, instead of a new version of this service.'" class="checkbox"><input v-model="spec.build.pr" type="checkbox"> Pull Request Workflow
          <label class="checkbox"><input v-model="spec.build.tag" type="checkbox"> Build on git tag</label>
        </label>
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
