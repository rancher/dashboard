<script>
import CruResource from '@shell/components/CruResource';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import UnitInput from '@shell/components/form/UnitInput';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import { CIS, CONFIG_MAP } from '@shell/config/types';
import { mapGetters } from 'vuex';
import createEditView from '@shell/mixins/create-edit-view';
import { allHash } from '@shell/utils/promise';
import { Checkbox } from '@components/Form/Checkbox';
import { RadioGroup } from '@components/Form/Radio';
import { get } from '@shell/utils/object';
import { _VIEW, _CREATE } from '@shell/config/query-params';
import { isValidCron } from 'cron-validator';
import { fetchSpecsScheduledScanConfig } from '@shell/models/cis.cattle.io.clusterscan';

const semver = require('semver');

export default {
  components: {
    CruResource, LabeledSelect, Banner, Loading, Checkbox, LabeledInput, RadioGroup, UnitInput
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
    // we need to force-fetch the resource fields, otherwise on page refresh
    // in the clusterscan edit/create views the "canBeScheduled" won't run properly
    await this.schema.fetchResourceFields();

    // Only initialize on create or if we don't have a spec object (added for resilience)
    if (this.realMode === _CREATE || !this.value.spec) {
      const includeScheduling = this.value.canBeScheduled();
      const spec = this.value.spec || {};

      spec.scanProfileName = null;
      if (includeScheduling) {
        spec.scoreWarning = 'pass';
        spec.scheduledScanConfig = { scanAlertRule: {}, retentionCount: 3 };
      }

      this.value.spec = spec;
    }

    if (!this.value.metadata.name) {
      this.value.metadata.generateName = 'scan-';
    }
    if (!this.value.spec.scheduledScanConfig) {
      this.value.spec['scheduledScanConfig'] = { scanAlertRule: {} };
    }
    if (!this.value.spec.scheduledScanConfig.scanAlertRule) {
      this.value.spec.scheduledScanConfig['scanAlertRule'] = { };
    }

    this.isScheduled = !!get(this.value, 'spec.scheduledScanConfig.cronSchedule');
    this.scheduledScanConfig = this.value.spec.scheduledScanConfig;
    this.scanAlertRule = this.value.spec.scheduledScanConfig.scanAlertRule;

    const hash = await allHash({
      profiles:               this.$store.dispatch('cluster/findAll', { type: CIS.CLUSTER_SCAN_PROFILE }),
      benchmarks:             this.$store.dispatch('cluster/findAll', { type: CIS.BENCHMARK }),
      // Ensure the clusterscan model has everything it needs
      hasScheduledScanConfig: fetchSpecsScheduledScanConfig(this.schema),
    });

    try {
      this.defaultConfigMap = await this.$store.dispatch('cluster/find', { type: CONFIG_MAP, id: 'cis-operator-system/default-clusterscanprofiles' });
    } catch {}

    this.allProfiles = hash.profiles;
    const { scanProfileName } = this.value.spec;

    // if mode is _CREATE and scanProfileName is defined, this is a clone
    // check if the profile referred to in the original spec still exists
    if (scanProfileName && this.mode === _CREATE) {
      const proxyObj = this.allProfiles.filter((profile) => profile.id === scanProfileName)[0];

      if (!proxyObj) {
        this.value.spec['scanProfileName'] = '';
      }
    }
  },

  data() {
    return {
      allProfiles:         [],
      defaultConfigMap:    null,
      scheduledScanConfig: null,
      scanAlertRule:       null,
      hasAlertManager:     false,
      isScheduled:         null
    };
  },

  computed: {
    ...mapGetters({ currentCluster: 'currentCluster', t: 'i18n/t' }),

    canBeScheduled() {
      // check if scan was created and run with an older cis install that doesn't support scheduling/alerting/warn state
      if (this.mode === _VIEW) {
        const warn = get(this.value, 'status.summary.warn');

        return !!warn || warn === 0;
      }

      return this.value.canBeScheduled();
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

        let name = profiles[provider] || profiles.default;

        if (name.includes(':')) {
          const pairs = name.split('\n');
          const clusterVersion = this.currentCluster.kubernetesVersion;

          pairs.forEach((pair) => {
            const version = (pair.match(/[<>=]+[-._a-zA-Z0-9]+/) || [])[0];

            try {
              if (semver.satisfies(clusterVersion, version)) {
                name = pair.replace(/[<>=]+[-._a-zA-Z0-9]+: /, '');
              }
            } catch (e) {
              // Ignore entries with invalid semver
            }
          });
        }
        if (name) {
          const profile = this.allProfiles.find((profile) => profile.id === name);
          const benchmarkVersion = profile?.spec?.benchmarkVersion;
          const benchmark = this.$store.getters['cluster/byId'](CIS.BENCHMARK, benchmarkVersion);

          if (this.validateBenchmark(benchmark, this.currentCluster )) {
            return profile;
          }
        }
        const cis16 = this.validProfiles.find((profile) => profile.value === 'cis-1.6-profile');

        if (cis16) {
          return this.allProfiles.find((profile) => profile.id === 'cis-1.6-profile');
        } else {
          return this.allProfiles.find((profile) => profile.id === 'cis-1.5-profile');
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

    validated() {
      if (this.isScheduled) {
        const schedule = get(this.value, 'spec.scheduledScanConfig.cronSchedule');

        if (!schedule) {
          return false;
        } else {
          // TODO - #13202: This is required due use of 2 libraries and 3 different libraries through the code.
          const predefined = [
            '@yearly',
            '@annually',
            '@monthly',
            '@weekly',
            '@daily',
            '@midnight',
            '@hourly'
          ];
          const isPredefined = predefined.includes(schedule);

          return (isPredefined || isValidCron(schedule)) && !!this.value.spec.scanProfileName;
        }
      }

      return !!this.value.spec.scanProfileName;
    }

  },

  watch: {
    defaultProfile(neu) {
      if (neu && !this.value.spec.scanProfileName) {
        const benchmarkVersion = neu?.spec?.benchmarkVersion;
        const benchmark = this.$store.getters['cluster/byId'](CIS.BENCHMARK, benchmarkVersion);

        if (!this.validateBenchmark(benchmark, this.currentCluster)) {
          return;
        }
        this.value.spec.scanProfileName = neu?.id;
      }
    },
  },

  methods: {
    validateBenchmark(benchmark, currentCluster) {
      if (!!benchmark?.spec?.clusterProvider) {
        if ( benchmark?.spec?.clusterProvider !== currentCluster.status.provider) {
          return false;
        }
      }

      try {
        const clusterVersion = currentCluster.kubernetesVersionDisplay;

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
      } catch (e) {
        // Ignore error if something is invalid semver
      }

      return true;
    },

    saveScan(cb) {
      if (!this.value.isScheduled || !this.isScheduled) {
        delete this.value.spec.scheduledScanConfig;
      }
      this.save(cb);
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <CruResource
    v-else
    :validation-passed="validated"
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    :errors="errors"
    @finish="saveScan"
    @error="e=>errors = e"
  >
    <Banner
      v-if="!validProfiles.length"
      color="warning"
      :label="t('cis.noProfiles')"
    />

    <div
      v-else
      class="row mb-20"
    >
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.spec.scanProfileName"
          :mode="mode"
          :label="t('cis.profile')"
          :options="validProfiles"
        />
      </div>
      <div
        v-if="canBeScheduled"
        class="col span-6"
      >
        <span>{{ t('cis.scoreWarning.label') }}</span> <i
          v-clean-tooltip="t('cis.scoreWarning.protip')"
          class="icon icon-info"
        />
        <RadioGroup
          v-model:value="value.spec.scoreWarning"
          :mode="mode"
          name="scoreWarning"
          :options="['pass', 'fail']"
          :labels="[t('cis.scan.pass'), t('cis.scan.fail')]"
        />
      </div>
    </div>
    <template v-if="canBeScheduled">
      <h3>{{ t('cis.scheduling.title') }}</h3>
      <div class="row mb-20">
        <div class="col">
          <RadioGroup
            v-model:value="isScheduled"
            :mode="mode"
            name="scheduling"
            :options="[ {value: false, label: t('cis.scheduling.disable')}, {value: true, label: t('cis.scheduling.enable')}]"
          />
        </div>
      </div>
      <template v-if="isScheduled">
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="scheduledScanConfig.cronSchedule"
              required
              :mode="mode"
              :label="t('cis.cronSchedule.label')"
              :placeholder="t('cis.cronSchedule.placeholder')"
              type="cron"
            />
          </div>
          <div class="col span-6">
            <UnitInput
              v-model:value="scheduledScanConfig.retentionCount"
              :suffix="t('cis.reports')"
              type="number"
              :mode="mode"
              :label="t('cis.retention')"
            />
          </div>
        </div>
        <h3 class="mt-20">
          {{ t('cis.alerting') }}
        </h3>
        <div class="row mb-20">
          <div class="col span-12">
            <Banner
              v-if="scanAlertRule.alertOnFailure || scanAlertRule.alertOnComplete"
              class="mt-0"
              :color="hasAlertManager ? 'info' : 'warning'"
            >
              <span v-clean-html="t('cis.alertNeeded', {link: monitoringUrl}, true)" />
            </banner>
            <Checkbox
              v-model:value="scanAlertRule.alertOnComplete"
              :mode="mode"
              :label="t('cis.alertOnComplete')"
            />
            <Checkbox
              v-model:value="scanAlertRule.alertOnFailure"
              :mode="mode"
              :label="t('cis.alertOnFailure')"
            />
          </div>
        </div>
      </template>
    </template>
  </CruResource>
</template>
