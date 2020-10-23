<script>
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import GithubPicker from '@/components/form/GithubPicker';
import Checkbox from '@/components/form/Checkbox';
import Ports from '@/components/form/Ports';

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
    NameNsDescription, LabeledInput, LabeledSelect, Ports, GithubPicker, Checkbox
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
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
    mode: {
      type:     String,
      required: true,
    },
    registerAfterHook: {
      type:    Function,
      default: null,
    },
    registerBeforeHook: {
      type:    Function,
      default: null,
    },
    realMode: {
      type:     String,
      required: true,
    }
  },

  data() {
    const spec = this.spec;
    const buildImage = !!(spec && spec.build && spec.build.repo);
    const hasGithub = this.$store.getters['auth/isGithub'];

    let buildMode = 'image';
    let image;

    let { build } = this.spec || {};

    if ( hasGithub && buildImage && spec.build.repo.startsWith('https://github.com/' && !this.isDemo) ) {
      buildMode = 'github';
      build.branch = build.branch || 'master';
    } else if ( buildImage ) {
      buildMode = 'git';
    } else {
      image = spec.image;
      build = null;
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
      buildModeLabels:      BUILD_MODES,
      initialWeightPercent: this.value.weightsPercent.desired,
      weightPercent:        this.value.weightsPercent.desired,
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

    showWeight() {
      return this.realMode === 'stage' || this.realMode === 'edit';
    },

    showVersion() {
      return this.realMode === 'stage' || this.realMode === 'edit';
    },

    showScale() {
      return true;
    },

    showNamespace() {
      return this.realMode === 'create';
    },

    extraColumns() {
      const out = [];

      if ( this.showVersion ) {
        out.push('version');
      }

      if ( this.showWeight ) {
        out.push('weight');
      }

      if ( this.showScale ) {
        out.push('scale');
      }

      return out;
    }
  },

  watch: {
    buildMode() {
      this.update();
    },
  },

  created() {
    this.registerAfterHook(() => {
      if ( this.realMode !== 'stage' && this.realMode !== 'edit' ) {
        return;
      }

      if ( this.weightPercent === this.initialWeightPercent ) {
        return;
      }

      return this.value.saveWeightPercent(this.weightPercent);
    });
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
        if (!this.build.branch) {
          this.build.branch = 'master';
        }
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
        if (!this.spec.autoscale.concurrecy) {
          this.spec.autoscale.concurrency = 10;
        }
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
      :label="isSidecar ? 'Container Name' : 'Service Name'"
      :extra-columns="extraColumns"
      :namespaced="showNamespace"
      :register-before-hook="registerBeforeHook"
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
          label="Name"
          :required="true"
          :disabled="mode !== 'create'"
          @input="updateGeneratedName"
        />
      </template>

      <template #version>
        <LabeledInput
          key="version"
          v-model="spec.version"
          :mode="mode"
          label="Version"
          :disabled="realMode !== 'stage'"
          @input="updateGeneratedName"
        />
      </template>

      <template #scale>
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

      <template #weight>
        <LabeledInput
          ref="weightPercent"
          v-model.number="weightPercent"
          type="number"
          label="Weight"
          size="4"
          min="0"
          max="100"
        >
          <template #suffix>
            <div class="addon">
              %
            </div>
          </template>
        </LabeledInput>
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
          v-model="image"
          :mode="mode"
          label="Image"
          placeholder="e.g. nginx:latest"
          :required="true"
          @input="update"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="spec.imagePullPolicy"
          :mode="mode"
          :options="imagePullPolicyChoices"
          label="Pull Policy"
        />
      </div>
    </div>

    <div v-if="buildMode === 'github'" class="row">
      <div class="col span-12">
        <GithubPicker
          v-model="build"
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
        <Checkbox
          v-if="buildMode === 'github'"
          v-model="spec.build.pr"
          class="checkbox"
          type="checkbox"
          label="true"
        >
          <template v-slot:label>
            Pull Request Workflow
            <i v-tooltip="'Creates a brand new service for each pull request created, using this service as a template.'" class="icon icon-info" />
          </template>
        </Checkbox>
        <Checkbox v-model="spec.build.tag" class="checkbox" label="Build on tag" type="checkbox" />
        <Checkbox v-model="spec.build.template" class="checkbox" label="Use this service as a template" type="checkbox" />
      </div>
    </div>

    <div class="row">
      <Ports
        v-model="spec.ports"
        class="col span-12"
        :name-resource="nameResource"
        :is-sidecar="isSidecar"
        :mode="mode"
        :pad-left="false"
      />
    </div>
  </div>
</template>
