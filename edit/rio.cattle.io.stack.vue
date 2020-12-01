<script>
import NameNsDescription from '@/components/form/NameNsDescription';
import GithubPicker from '@/components/form/GithubPicker';
import LabeledInput from '@/components/form/LabeledInput';
import CreateEditView from '@/mixins/create-edit-view';
import Footer from '@/components/form/Footer';
// import { DEMO } from '@/config/query-params';
// import DEMOS from '@/config/demos';

const BUILD_MODES = {
  empty:  'Create an empty stack',
  github: 'Import a Riofile from a GitHub repo',
  git:    'Import a Riofile from another repository'
};

export default {
  name: 'CruStack',

  components: {
    NameNsDescription, GithubPicker, LabeledInput, Footer
  },

  mixins: [CreateEditView],

  /* @TODO replace with fetch or something
  async asyncData(ctx) {
    const { query } = ctx;

    const out = await defaultAsyncData(ctx);
    const demoName = query[DEMO];

    out.isDemo = false;

    if ( demoName && DEMOS[demoName] ) {
      out.model.spec = DEMOS[demoName].spec;
      out.isDemo = true;
    }

    return out;
  },
  */

  data() {
    let spec = this.value.spec;

    if ( !spec ) {
      spec = {};
      this.value.spec = spec;
    }

    if ( !spec.build ) {
      spec.build = {};
    }

    const buildImage = !!(spec && spec.build && spec.build.repo);
    const hasGithub = this.$store.getters['auth/isGithub'];
    let buildMode = 'empty';

    if ( hasGithub && buildImage && spec.build.repo.startsWith('https://github.com/' && !this.isDemo) ) {
      buildMode = 'github';
      spec.build.branch = spec.build.branch || 'master';
      spec.build.riofile = spec.build.riofile || 'Riofile';
    } else if ( buildImage ) {
      buildMode = 'git';
    }

    return {
      hasGithub,
      buildMode,
      build:           spec.build,
      buildModeLabels: BUILD_MODES,
    };
  },

  computed: {
    buildModeOptions() {
      const githubDisabled = !this.hasGithub;

      return Object.keys(BUILD_MODES).map((k) => {
        return {
          label:    BUILD_MODES[k],
          value:    k,
          disabled: k === 'github' && githubDisabled,
          tooltip:  k === 'github' && githubDisabled ? 'You did not log in with GitHub' : null,
        };
      });
    }
  }
};
</script>
<template>
  <form>
    <NameNsDescription
      :value="value"
      :mode="mode"
      label="Stack Name"
      :register-before-hook="registerBeforeHook"
    />

    <div class="spacer"></div>

    <h4>Mode</h4>
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

    <div v-if="buildMode === 'github'" class="row">
      <div class="col span-12">
        <GithubPicker
          v-model="build"
          file-pattern="Riofile"
          preferred-file="Riofile"
          file-key="rioFile"
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
          <LabeledInput v-model="build.riofile" :mode="mode" label="Path to Riofile" @input="update" />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="build.revision" :mode="mode" label="Commit ID or Tag" @input="update" />
        </div>
      </div>
    </div>

    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </form>
</template>
