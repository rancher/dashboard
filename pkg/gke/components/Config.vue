<script lang="ts">
import { PropType, defineComponent } from 'vue';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

import {
  DEFAULT_GCP_REGION, DEFAULT_GCP_ZONE, getGKEZones, getGKERegionFromZone,
  getGKEVersions, getGKEClusters,

} from '../util/gcp';
import { sortBy, sortableNumericSuffix } from '@shell/utils/sort';

import semver from 'semver';

import type { getGKEVersionsResponse, getGKEClustersResponse } from '../types/gcp.d.ts';
import debounce from 'lodash/debounce';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { mapGetters } from 'vuex';

export default defineComponent({
  name: 'GKEConfig',

  emits: ['update:kubernetesVersion', 'update:locations', 'update:zone', 'update:region', 'update:defaultImageType', 'error', 'update:clusterName', 'update:clusterDescription'],

  components: {
    RadioGroup,
    LabeledSelect,
    Checkbox,
    LabeledInput
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    isNewOrUnprovisioned: {
      type:    Boolean,
      default: true
    },

    zone: {
      type:    String,
      default: ''
    },

    region: {
      type:    String,
      default: ''
    },

    locations: {
      type:    Array as PropType<string[]>,
      default: () => []
    },

    cloudCredentialId: {
      type:    String,
      default: ''
    },

    projectId: {
      type:    String,
      default: ''
    },

    originalVersion: {
      type:    String,
      default: ''
    },

    clusterId: {
      type:    String,
      default: ''
    },

    clusterName: {
      type:    String,
      default: ''
    },

    clusterDescription: {
      type:    String,
      default: ''
    },

    kubernetesVersion: {
      type:    String,
      default: ''
    },

    defaultImageType: {
      type:    String,
      default: ''
    },

    isImport: {
      type:    Boolean,
      default: false
    },

    rules: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  created() {
    this.debouncedLoadGCPData = debounce(this.loadGCPData, 200);
    this.debouncedLoadGCPData();
  },

  data() {
    const t = this.$store.getters['i18n/t'];
    const supportedVersionRange = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_SUPPORTED_K8S_VERSIONS)?.value;

    return {
      debouncedLoadGCPData: (zones = true) => {},
      loadingVersions:      false,
      loadingZones:         false,

      versionsResponse: {} as getGKEVersionsResponse,
      /**
       * these are NOT cluster objects in the Rancher cluster (management.cattle.io.cluster provisioning.cattle.io.cluster etc)
       * this is a list of clusters in the user's GCP project, which, on edit, will include the current cluster
       * on edit, this gcp representation of the cluster is checked for a release channel to determine which k8s versions to offer
       */
      clustersResponse: {} as getGKEClustersResponse,
      supportedVersionRange,
      zoneRadioOptions: [{ label: t('gke.location.zonal'), value: false }, { label: t('gke.location.regional'), value: true }],
      zones:            [] as any[],
      selectedZone:     null as null | {name: string},
    };
  },

  watch: {
    versionOptions(neu) {
      if (neu && neu.length && !this.kubernetesVersion) {
        this.$emit('update:kubernetesVersion', this.versionOptions[0].value);
      }
    },

    cloudCredentialId() {
      this.debouncedLoadGCPData();
    },

    projectId() {
      this.debouncedLoadGCPData();
    },

    region: {
      handler(neu) {
        if (!!neu) {
          this.debouncedLoadGCPData(false);
        }
      },
      immediate: true
    },

    zone: {
      handler(neu) {
        if (!!neu) {
          this.debouncedLoadGCPData(false);
        }
      },
      immediate: true
    },

    extraZoneOptions(neu, old) {
      if (!neu || !neu.length) {
        return;
      }
      if (this.useRegion) {
        // checking old.length here ensures we don't clear out preconfigured location data when the form initially loads
        if (old.length) {
          const defaultExtraZone = neu[0]?.name;

          this.$emit('update:locations', [defaultExtraZone]);
        }
      }
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    isCreate(): boolean {
      return this.mode === _CREATE;
    },

    isView(): boolean {
      return this.mode === _VIEW;
    },

    releaseChannel(): string | undefined {
      const cluster = (this.clustersResponse?.clusters || []).find((c) => c.name === this.clusterName);

      return cluster?.releaseChannel?.channel;
    },

    useRegion: {
      get(): boolean {
        return !!this.region;
      },
      set(neu: boolean) {
        if (neu) {
          this.$emit('update:zone', null);
          this.$emit('update:region', this.defaultRegion);
        } else {
          this.$emit('update:region', null);
          this.setZone({ name: this.defaultZone });
        }
      }
    },

    zonesByRegion(): {[key:string]: any[]} {
      const out: {[key:string]: any[]} = {};

      this.zones.forEach((zone: any) => {
        const regionName = getGKERegionFromZone(zone);

        if (regionName) {
          if (!out[regionName]) {
            out[regionName] = [];
          }
          out[regionName].push(zone);
        }
      });

      return out;
    },

    regions(): string[] {
      return (Object.keys(this.zonesByRegion) || []).sort();
    },

    // checkboxes which appear next to the zone/region dropdown, and populate the 'locations' array
    extraZoneOptions(): {name: string}[] {
      // region/zone data isnt fetched in view mode: display any selected extra zones instead
      if (this.mode === _VIEW) {
        return this.locations.map((zone:string) => {
          return { name: zone };
        });
      }
      if (this.region) {
        return this.zonesByRegion[this.region] || [];
      } if (this.zone) {
        const zoneOption = this.zones.find((z) => z.name === this.zone);

        if (!zoneOption) {
          return [];
        }
        const region = getGKERegionFromZone(zoneOption);

        return region ? (this.zonesByRegion[region] || []).filter((zone) => zone.name !== this.zone) : [];
      }

      return [];
    },

    defaultRegion() {
      if (!this.regions || !this.regions.length || this.regions.find((r) => r === DEFAULT_GCP_REGION)) {
        return DEFAULT_GCP_REGION;
      }

      return this.regions[0];
    },

    defaultZone() {
      if (!this.zones || !this.zones.length || this.zones.find((z) => z?.name === DEFAULT_GCP_ZONE)) {
        return DEFAULT_GCP_ZONE;
      }

      if (!!this.region) {
        return this.extraZoneOptions[0]?.name;
      }

      return this.zones[0].name;
    },

    // if editing an existing cluster use versions from relevant release channel
    // filter based off supported version range
    // if current cluster version is outside of supported range, show it anyway
    // disable versions more than one minor version away from the current version
    versionOptions(): {label: string, value: string, disabled?:boolean}[] {
      let out: {label: string, value: string, disabled?:boolean}[] = [];
      let versions: string[] = [];
      const { supportedVersionRange, originalVersion } = this;
      const originalMinorVersion = !!originalVersion ? semver.parse(originalVersion).minor : null;

      if (!!this.releaseChannel) {
        versions = (this.versionsResponse?.channels || []).find((ch) => ch.channel === this.releaseChannel)?.validVersions || [];
      }
      if (!versions || !versions.length) {
        versions = this.versionsResponse?.validMasterVersions || [];
      }

      out = versions.reduce((opts, v) => {
        if (supportedVersionRange && !semver.satisfies(semver.coerce(v), supportedVersionRange)) {
          return opts;
        }
        if (originalVersion && !semver.gte(v, originalVersion)) {
          return opts;
        }
        if (v === originalVersion) {
          opts.push({ label: `${ v } (${ this.t('gke.version.current') })`, value: v });
        } else if (originalMinorVersion && originalMinorVersion < (semver.parse(v, { includePrerelease: true }).minor - 1)) {
          opts.push({
            label: v, value: v, disabled: true
          });
        } else {
          opts.push({ label: v, value: v });
        }

        return opts;
      }, [] as {label: string, value: string, disabled?:boolean}[]);

      if (originalVersion && !semver.satisfies(semver.coerce(originalVersion), supportedVersionRange)) {
        out.push({ label: `${ originalVersion } (${ this.t('gke.version.current') })`, value: originalVersion });
      }

      return out;
    },
  },
  methods: {
    // when credential/region/zone change, fetch dependent resources from gcp
    loadGCPData(loadZones = true) {
      if (!this.isView) {
        // wont show a version picker when initially importing a cluster
        if (!this.isImport) {
          this.loadingVersions = true;
          this.getVersions();
        }

        if (loadZones) {
          this.loadingZones = true;
          this.getZones();
        }
        // gcp clusters are fetched on edit to check this cluster's release channel & offer appropriate k8s versions
        if (this.mode !== _CREATE) {
          this.getClusters();
        }
      }
    },

    async getVersions() {
      try {
        const res = await getGKEVersions(this.$store, this.cloudCredentialId, this.projectId, { zone: this.zone, region: this.region });

        this.versionsResponse = res;
        if (res.defaultImageType) {
          this.$emit('update:defaultImageType', res.defaultImageType);
        }
      } catch (err:any) {
        this.$emit('error', err);
      }

      this.loadingVersions = false;
    },

    async getClusters() {
      try {
        const res = await getGKEClusters(this.$store, this.cloudCredentialId, this.projectId, { zone: this.zone, region: this.region }, this.clusterId);

        this.clustersResponse = res;
      } catch (err:any) {
        this.$emit('error', err);
      }
    },

    async getZones() {
      try {
        let location: {zone?:string, region?:string} = { zone: this.zone };

        if (this.useRegion) {
          location = { region: this.region };
        }
        const res = await getGKEZones(this.$store, this.cloudCredentialId, this.projectId, location);

        this.zones = sortBy((res.items || []).map((z) => {
          z.disabled = z?.status?.toLowerCase() !== 'up';
          z.sortName = sortableNumericSuffix(z.name);

          return z;
        }), 'sortName', false);
      } catch (e) {
        this.$emit('error', e);
        this.zones = [];
      }
      this.loadingZones = false;
    },

    setRegion(neu: string) {
      this.$emit('update:region', neu);
    },

    setZone(neu: {name: string}) {
      this.selectedZone = neu;
      this.$emit('update:zone', neu.name);

      this.$emit('update:locations', [neu.name]);
    },

    setExtraZone(add: boolean, zone: string) {
      const out = [...this.locations];

      if (add && !out.includes(zone)) {
        out.push(zone);
      } else {
        out.splice(out.indexOf(zone), 1);
      }
      this.$emit('update:locations', out);
    }
  },
});
</script>

<template>
  <div>
    <div class="row mb-10">
      <div :class="{col: true, 'span-4': !isImport, 'span-6': isImport}">
        <LabeledInput
          :value="clusterName"
          :mode="mode"
          label-key="generic.name"
          required
          :rules="rules.clusterName"
          data-testid="gke-cluster-name"
          @update:value="$emit('update:clusterName', $event)"
        />
      </div>
      <div :class="{col: true, 'span-4': !isImport, 'span-6': isImport}">
        <LabeledInput
          :value="clusterDescription"
          :mode="mode"
          label-key="nameNsDescription.description.label"
          :placeholder="t('nameNsDescription.description.placeholder')"
          data-testid="gke-cluster-description"
          @update:value="$emit('update:clusterDescription', $event)"
        />
      </div>
      <div
        v-if="!isImport"
        class="col span-4"
      >
        <LabeledSelect
          :options="versionOptions"
          label-key="gke.version.label"
          :value="kubernetesVersion"
          :tooltip="isCreate? '' :t('gke.version.tooltip')"
          :loading="loadingVersions"
          data-testid="gke-version-select"
          :mode="mode"
          @selecting="$emit('update:kubernetesVersion', $event)"
        />
      </div>
    </div>

    <div class="row location-row mb-10">
      <div class="col span-4">
        <LabeledSelect
          v-if="useRegion"
          label-key="gke.location.region"
          :mode="mode"
          :options="regions"
          :value="region"
          :disabled="!isNewOrUnprovisioned"
          :loading="loadingZones"
          @selecting="setRegion"
        />
        <LabeledSelect
          v-else
          label-key="gke.location.zone"
          :mode="mode"
          :options="zones"
          option-key="name"
          option-label="name"
          :value="zone"
          :disabled="!isNewOrUnprovisioned"
          :loading="loadingZones"
          data-testid="gke-zone-select"
          @selecting="setZone"
        />
      </div>
      <div
        v-if="!loadingZones && !isImport"
        class="col span-2 extra-zones"
        data-testid="gke-extra-zones-container"
      >
        <span class="text-muted">{{ t('gke.location.extraZones') }}</span>
        <span
          v-if="isView && !locations.length"
          class="text-muted"
        >&mdash;</span>
        <Checkbox
          v-for="(zoneOpt, i) in extraZoneOptions"
          :key="i"
          :label="zoneOpt.name"
          :value="locations.includes(zoneOpt.name)"
          :data-testid="`gke-extra-zones-${zoneOpt.name}`"
          :disabled="isView"
          class="extra-zone-checkbox"
          @update:value="e=>setExtraZone(e, zoneOpt.name)"
        />
      </div>
      <div class="col">
        <RadioGroup
          v-model:value="useRegion"
          :mode="mode"
          :options="zoneRadioOptions"
          name="regionmode"
          :disabled="!isNewOrUnprovisioned"
          data-testid="gke-location-mode-radio"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.location-row{
  display: flex;
  align-items: center;
}
.extra-zones  {
  display: flex;
  flex-direction: column;
}
</style>
