<script lang="ts">
import { defineComponent } from 'vue';
import { _CREATE } from '@shell/config/query-params';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { DEFAULT_GCP_REGION, DEFAULT_GCP_ZONE, getGKEZones, regionFromZone } from '../util/gcp';
import { sortBy, sortableNumericSuffix } from '@shell/utils/sort';

export default defineComponent({
  components: {
    RadioGroup,
    LabeledSelect,
    Checkbox
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
      type:    Array,
      default: () => []
    },
    cloudCredentialId: {
      type:    String,
      default: ''
    },
    projectId: {
      type:    String,
      default: ''
    }
  },

  data() {
    const t = this.$store.getters['i18n/t'];

    return {
      zoneRadioOptions: [{ label: 'Zonal', value: false }, { label: 'Regional', value: true }],
      zones:            [] as any[],
      selectedZone:     null,
    };
  },

  watch: {
    region: {
      async handler(neu) {
        this.$emit('update:locations', []);
        if (!!neu) {
          try {
            const res = await getGKEZones(this.$store, this.cloudCredentialId, this.projectId, { region: neu });

            this.zones = res.items || [];
          } catch (e) {
            this.$emit('error', e); this.zones = [];
          }
        }
      },
      immedaite: true
    },

    zone: {
      async handler(neu) {
        this.$emit('update:locations', []);
        if (!!neu) {
          try {
            const res = await getGKEZones(this.$store, this.cloudCredentialId, this.projectId, { zone: neu });

            this.zones = sortBy((res.items || []).map((z) => {
              z.disabled = z?.status?.toLowerCase() !== 'up';
              z.sortName = sortableNumericSuffix(z.name);

              return z;
            }), 'sortName', false);
          } catch (e) {
            this.$emit('error', e);
            this.zones = [];
          }
        }
      },
      immediate: true
    },

    extraZoneOptions(neu) {
      if (!neu || !neu.length) {
        return;
      }
      if (this.useRegion) {
        const defaultExtraZone = neu[0]?.name;

        this.$emit('update:locations', [defaultExtraZone]);
      }
    }
  },

  computed: {
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
          this.$emit('update:zone', this.defaultZone);
        }
      }
    },

    zonesByRegion(): {[key:string]: any[]} {
      const out: {[key:string]: any[]} = {};

      this.zones.forEach((zone: any) => {
        const regionName = regionFromZone(zone);

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
    extraZoneOptions() {
      if (this.region) {
        return this.zonesByRegion[this.region] || [];
      } if (this.zone) {
        const zoneOption = this.zones.find((z) => z.name === this.zone);

        if (!zoneOption) {
          return [];
        }
        const region = regionFromZone(zoneOption);

        return (this.zonesByRegion[region] || []).filter((zone) => zone.name !== this.zone);
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
    }
  },
  methods: {
    setRegion(neu) {
      this.$emit('update:region', neu);
    },

    setZone(neu) {
      this.selectedZone = neu;
      this.$emit('update:zone', neu.name);
    },

    setExtraZone(add: boolean, zone) {
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
  <div class="row location-row mb-10">
    <div class="col span-4">
      <RadioGroup
        v-model="useRegion"
        :mode="mode"
        :options="zoneRadioOptions"
        name="regionmode"
        :disabled="!isNewOrUnprovisioned"
      />
    </div>
    <div class="col span-4">
      <LabeledSelect
        v-if="useRegion"
        label="Region"
        :mode="mode"
        :options="regions"
        :value="region"
        :disabled="!isNewOrUnprovisioned"
        @selecting="setRegion"
      />
      <LabeledSelect
        v-else
        label="Zone"
        :mode="mode"
        :options="zones"
        option-key="name"
        option-label="name"
        :value="zone"
        :disabled="!isNewOrUnprovisioned"
        @selecting="setZone"
      />
    </div>
    <div class="col span-4 extra-zones">
      <span class="text-muted">Extra Zones</span>
      <Checkbox
        v-for="zoneOpt in extraZoneOptions"
        :key="zoneOpt.name"
        :label="zoneOpt.name"
        :value="locations.includes(zoneOpt.name)"
        @input="e=>setExtraZone(e, zoneOpt.name)"
      />
    </div>
  </div>
</template>

<style lang="scss">
.location-row{
  display: flex;
  align-items: center;
}
.extra-zones  {
  display: flex;
  flex-direction: column;
}
</style>
