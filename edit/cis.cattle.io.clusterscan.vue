<script>
import CruResource from '@/components/CruResource';
import LabeledSelect from '@/components/form/LabeledSelect';
import LabeledInput from '@/components/form/LabeledInput';

import Banner from '@/components/Banner';
import Loading from '@/components/Loading';
import { CIS, CONFIG_MAP, ENDPOINTS } from '@/config/types';
import { mapGetters } from 'vuex';
import createEditView from '@/mixins/create-edit-view';
import { allHash } from '@/utils/promise';
import Checkbox from '@/components/form/Checkbox';
import cronstrue from 'cronstrue';

const semver = require('semver');

export default {
  components: {
    CruResource, LabeledSelect, Banner, Loading, Checkbox, LabeledInput
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
      defaultConfigMap: this.$store.dispatch('cluster/find', { type: CONFIG_MAP, id: 'cis-operator-system/default-clusterscanprofiles' }),
    });

    try {
      await this.$store.dispatch('cluster/find', { type: ENDPOINTS, id: 'cattle-monitoring-system/rancher-monitoring-alertmanager' });

      this.hasAlertManager = true;
    } catch {
      this.hasAlertManager = false;
    }

    this.allProfiles = hash.profiles;
    this.defaultConfigMap = hash.defaultConfigMap;
  },

  data() {
    if (!this.value.metadata.name) {
      this.value.metadata.generateName = 'scan-';
    }

    return {
      allProfiles: [], defaultConfigMap: null, scanAlertRule: this.value.spec.scanAlertRule, hasAlertManager: false
    };
  },

  computed: {
    ...mapGetters({ currentCluster: 'currentCluster', t: 'i18n/t' }),

    cronLabel() {
      const { cronSchedule } = this.value.spec;

      if (!cronSchedule) {
        return null;
      }

      try {
        const hint = cronstrue.toString(cronSchedule);

        return hint;
      } catch (e) {
        return 'invalid cron expression';
      }
    },

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
    },

    monitoringUrl() {
      return this.$router.resolve({
        name:   'c-cluster-monitoring',
        params: { cluster: this.$route.params.cluster }
      }).href;
    },
  },

  watch: {
    defaultProfile(neu) {
      if (neu && !this.value.spec.scanProfileName) {
        this.value.spec.scanProfileName = neu?.id;
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
    :validation-passed="!!value.spec.scanProfileName"
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    :errors="errors"
    @finish="save"
    @error="e=>errors = e"
  >
    <template>
      <Banner v-if="!validProfiles.length" color="warning" :label="t('cis.noProfiles')" />

      <div v-else class="row mb-20">
        <div class="col span-4">
          <LabeledSelect
            v-model="value.spec.scanProfileName"
            :mode="mode"
            :label="t('cis.profile')"
            :options="validProfiles"
          />
        </div>
        <div class="col span-4">
          <LabeledInput v-model="value.spec.cronSchedule" :mode="mode" :label="t('cis.cronSchedule.label')" :placeholder="t('cis.cronSchedule.placeholder')" />
          <span class="text-muted">{{ cronLabel }}</span>
        </div>
        <div class="col span-4">
          <LabeledInput v-model.number="value.spec.retention" type="number" :mode="mode" :label="t('cis.retention')" />
        </div>
      </div>
      <h4>Alerting</h4>
      <div class="row">
        <Banner v-if="scanAlertRule.alertOnComplete || scanAlertRule.alertOnFailure" :color="hasAlertManager ? 'info' : 'warning'">
          <span v-if="!hasAlertManager" v-html="t('cis.alertNotFound')" />
          <span v-html="t('cis.alertNeeded', {link: monitoringUrl}, true)" />
        </banner>
      </div>
      <div class="row">
        <div class="col span-6">
          <Checkbox v-model="scanAlertRule.alertOnComplete" :label="t('cis.alertOnComplete')" />
          <Checkbox v-model="scanAlertRule.alertOnFailure" :label="t('cis.alertOnFailure')" />
        </div>
      </div>
    </template>
  </CruResource>
</template>
