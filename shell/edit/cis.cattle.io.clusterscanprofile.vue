<script>
import NameNsDescription from '@shell/components/form/NameNsDescription';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ArrayList from '@shell/components/form/ArrayList';
import createEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import { mapGetters } from 'vuex';
import { CIS } from '@shell/config/types';
const semver = require('semver');

export default {
  components: {
    NameNsDescription,
    LabeledSelect,
    ArrayList,
    CruResource
  },

  mixins: [createEditView],

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    mode: {
      type:    String,
      default: 'create'
    }
  },

  async fetch() {
    this.allBenchmarks = await this.$store.dispatch('cluster/findAll', { type: CIS.BENCHMARK });
  },

  data() {
    if (!this.value.spec) {
      this.$set(this.value, 'spec', {});
    }

    return { allBenchmarks: [], name: this.value.metadata.name };
  },

  computed: {
    ...mapGetters({ currentCluster: 'currentCluster', t: 'i18n/t' }),

    provider() {
      return this.currentCluster.status.provider;
    },

    compatibleBenchmarkNames() {
      return this.allBenchmarks.filter((benchmark) => {
        return this.validateBenchmark(benchmark);
      }).reduce((names, benchmark) => {
        names.push(benchmark.id);

        return names;
      }, []);
    },

  },

  watch: {
    compatibleBenchmarkNames(neu) {
      if (neu.length === 1) {
        this.value.spec.benchmarkVersion = neu[0];
      }
    },
  },
  methods: {
    // filter benchmarks by spec.clusterProvider and kubernetes min/max version
    // include benchmarks with no clusterProvider defined
    validateBenchmark(benchmark) {
      if (!!benchmark?.spec?.clusterProvider) {
        return benchmark?.spec?.clusterProvider === this.provider;
      }

      try {
        const clusterVersion = this.currentCluster.kubernetesVersionDisplay;

        if (benchmark?.spec?.minKubernetesVersion) {
          if (semver.gt(benchmark?.spec?.minKubernetesVersion, clusterVersion)) {
            return false;
          }
        }
        if (benchmark?.spec?.maxKubernetesVersion) {
          if (semver.gt(clusterVersion, benchmark?.spec?.maxKubernetesVersion)) {
            return false;
          }
        }

        return true;
      } catch (e) {
        // If a version doesn't parse, show it
        return true;
      }
    }
  }
};
</script>

<template>
  <div>
    <CruResource
      :validation-passed="!!name && !!value.spec.benchmarkVersion"
      :done-route="doneRoute"
      :resource="value"
      :mode="mode"
      :errors="errors"
      @finish="save"
      @error="e=>errors = e"
    >
      <template>
        <div class="spacer"></div>
        <div class="row">
          <div class="col span-12">
            <NameNsDescription :mode="mode" :value="value" :namespaced="false" @change="name=value.metadata.name" />
          </div>
        </div>
        <div class="row">
          <div class="col span-6">
            <LabeledSelect v-model="value.spec.benchmarkVersion" :mode="mode" :label="t('cis.benchmarkVersion')" :options="compatibleBenchmarkNames" />
          </div>
        </div>
        <div class="spacer" />
        <div class="row">
          <div class="col span-6">
            <ArrayList
              v-model="value.spec.skipTests"
              :title="t('cis.testsToSkip')"
              :value-placeholder="t('cis.testID')"
              :mode="mode"
            />
          </div>
        </div>
      </template>
    </CruResource>
  </div>
</template>
