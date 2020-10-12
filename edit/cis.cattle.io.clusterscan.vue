<script>
import CruResource from '@/components/CruResource';
import LabeledSelect from '@/components/form/LabeledSelect';
import Banner from '@/components/Banner';
import Loading from '@/components/Loading';
import { CIS, CONFIG_MAP } from '@/config/types';
import { mapGetters } from 'vuex';
import createEditView from '@/mixins/create-edit-view';
import { allHash } from '@/utils/promise';
const semver = require('semver');

export default {
  components: {
    CruResource, LabeledSelect, Banner, Loading
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
    const hash = await allHash({
      profiles:         this.$store.dispatch('cluster/findAll', { type: CIS.CLUSTER_SCAN_PROFILE }),
      benchmarks:       this.$store.dispatch('cluster/findAll', { type: CIS.BENCHMARK }),
      defaultConfigMap: this.$store.dispatch('cluster/find', { type: CONFIG_MAP, id: 'cis-operator-system/default-clusterscanprofiles' })
    });

    this.allProfiles = hash.profiles;
    this.defaultConfigMap = hash.defaultConfigMap;
  },

  data() {
    if (!this.value.metadata.name) {
      this.value.metadata.generateName = 'scan-';
    }
    if (!this.value.spec) {
      this.value.spec = { scanProfileName: null };
    }

    return {
      allProfiles: [], defaultConfigMap: null, scanProfileName: this.value.spec.scanProfileName
    };
  },

  computed: {
    ...mapGetters({ currentCluster: 'currentCluster', t: 'i18n/t' }),

    validProfiles() {
      const profileNames = this.allProfiles.filter((profile) => {
        const benchmarkVersion = profile?.spec?.benchmarkVersion;
        const benchmark = this.$store.getters['cluster/byId'](CIS.BENCHMARK, benchmarkVersion);

        return this.validateBenchmark(benchmark, this.currentCluster );
      }).map((profile) => {
        return { label: profile.id, value: profile.id };
      });

      return profileNames;
    },

    defaultProfile() {
      if (this.defaultConfigMap) {
        const profiles = this.defaultConfigMap.data;
        const provider = this.currentCluster.status.provider;

        const name = profiles[provider] || profiles.default;

        if (name) {
          return this.allProfiles.find(profile => profile.id === name);
        }
      }

      return null;
    }
  },

  watch: {
    defaultProfile(neu) {
      if (neu && !this.scanProfileName) {
        this.scanProfileName = neu?.id;
      }
    },
  },

  methods: {
    validateBenchmark(benchmark, currentCluster) {
      const clusterVersion = currentCluster.kubernetesVersion;

      if (!!benchmark?.spec?.clusterProvider) {
        return benchmark?.spec?.clusterProvider === currentCluster.status.provider;
      }
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
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <CruResource
    v-else
    :validation-passed="!!scanProfileName"
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    @finish="save"
  >
    <template>
      <Banner v-if="!validProfiles.length" color="warning" :label="t('cis.noProfiles')" />

      <div v-else class="row">
        <div class="col span-6">
          <LabeledSelect
            v-model="scanProfileName"
            :mode="mode"
            :label="t('cis.profile')"
            :options="validProfiles"
            @input="value.spec.scanProfileName = $event"
          />
        </div>
      </div>
    </template>
  </CruResource>
</template>
