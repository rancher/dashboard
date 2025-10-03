<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import { _CREATE } from '@shell/config/query-params';
import { stringify } from '@shell/utils/error';
import { Banner } from '@components/Banner';
import merge from 'lodash/merge';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import ArrayList from '@shell/components/form/ArrayList';
import GCEImage from '@shell/machine-config/components/GCEImage.vue';
import { convertStringToKV, convertKVToString } from '@shell/utils/object';
import KeyValue from '@shell/components/form/KeyValue';
import {
  getGKEZones, getGKEDiskTypes, getGKENetworks, getGKEMachineTypes, getGKESubnetworks, getGKESharedSubnetworks
} from '@shell/components/google/util/gcp';
import { formatSharedNetworks, formatNetworkOptions, formatSubnetworkOptions } from '@shell/components/google/util/formatter';
import { mapGetters } from 'vuex';
import { sortBy, sortableNumericSuffix } from '@shell/utils/sort';
const GKE_NONE_OPTION = 'none';

const DEFAULT_MIN_DISK = 10;

const defaultConfig = Object.freeze({
  zone:                          'us-central1-a',
  machineImage:                  '',
  diskType:                      'pd-standard',
  network:                       '',
  subnetwork:                    '',
  scopes:                        'https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write',
  machineType:                   'n1-standard-2',
  diskSize:                      '50',
  tags:                          '',
  address:                       '',
  openPort:                      [],
  vmLabels:                      '',
  username:                      'docker-user',
  setInternalFirewallRulePrefix: true,
  setExternalFirewallRulePrefix: false,
  preemptible:                   false
});

export default {
  emits: ['expandAdvanced', 'error', 'validationChanged'],

  components: {
    ArrayList,
    Banner,
    Checkbox,
    KeyValue,
    LabeledInput,
    LabeledSelect,
    Loading,
    GCEImage
  },

  mixins: [CreateEditView, FormValidation],

  props: {
    credentialId: {
      type:     String,
      required: true,
    },
    projectId: {
      type:    String,
      default: null,
    },
    mode: {
      type:    String,
      default: _CREATE,
    },
    uuid: {
      type:     String,
      required: true,
    },

    disabled: {
      type:    Boolean,
      default: false
    },
    poolCreateMode: {
      type:    Boolean,
      default: true
    },
  },

  async fetch() {
    if ( !this.credentialId ) {
      return;
    }

    for (const key in this.defaultConfig) {
      if (this.value[key] === undefined && !!this.defaultConfig[key]) {
        this.value[key] = this.defaultConfig[key];
      }
    }
    await Promise.all([this.getZones(), this.getOptions()]);
  },

  data() {
    return {
      defaultConfig,
      loadingZones:                 false,
      loadingDiskTypes:             false,
      loadingNetworks:              false,
      loadingMachineTypes:          false,
      zones:                        [],
      diskTypes:                    [],
      networks:                     [],
      subnetworks:                  [],
      sharedSubnetworks:            [],
      machineTypes:                 [],
      useIpAliases:                 false,
      minDiskFromImage:             DEFAULT_MIN_DISK,
      originalOpenPort:             this.value.openPort || [],
      originalMachineImage:         this.value.machineImage,
      diskSizeRequirementsFromType: null,
      fvFormRuleSets:               [
        { path: 'machineImage', rules: ['required'] },
        { path: 'diskType', rules: ['required'] },
        { path: 'diskSize', rules: ['required', 'isPositive', 'minDiskFromImageSize'] },
        { path: 'machineType', rules: ['required'] },
        { path: 'network', rules: ['required'] },
      ]
    };
  },
  created() {
    if (this.poolCreateMode) {
      this.$emit('validationChanged', false);
      this.value.project = this.projectId;
      for (const key in this.defaultConfig) {
        if (this.value[key] === undefined && !!this.defaultConfig[key]) {
          this.value[key] = this.defaultConfig[key];
        }
      }
      merge(this.value, this.defaultConfig);
    } else {
      this.value.setInternalFirewallRulePrefix = !!this.value.internalFirewallRulePrefix;
      this.value.setExternalFirewallRulePrefix = !!this.value.externalFirewallRulePrefix;
    }
  },

  watch: {
    credentialId() {
      this.$fetch();
    },
    fvFormIsValid(newVal) {
      this.$emit('validationChanged', !!newVal);
    },

    'value.zone'() {
      this.getOptions();
    },
    'value.availabilityZone'(neu) {
      if (neu && (!this.value.managedDisks || !this.value.enablePublicIpStandardSku || !this.value.staticPublicIp)) {
        this.$emit('expandAdvanced');
      }
    },
    'value.setExternalFirewallRulePrefix'(neu) {
      if (!neu) {
        this.value.openPort = [];
      } else if (this.poolCreateMode) {
        this.value.openPort.push('6443');
      } else {
        this.value.openPort = this.originalOpenPort.length > 0 ? this.originalOpenPort : ['6443'];
      }
    },

    networkOptions(neu) {
      if (neu && neu.length && !this.value.network) {
        const defaultNetwork = neu.find((network) => network?.name === 'default');

        if (defaultNetwork) {
          this.value.network = defaultNetwork.name;
        } else {
          const firstnetwork = neu.find((network) => network.kind !== 'group');

          this.value.network = firstnetwork.name;
        }
      }
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    fvExtraRules() {
      return {
        minDiskFromImageSize: (val) => {
          let minTotal = Number(this.minDiskFromImage);
          let maxTotal = null;
          const valAsNumber = Number(val || 0);

          if ( !!this.diskSizeRequirementsFromType) {
            const vals = this.diskSizeRequirementsFromType.split('-');
            const minFromType = vals[0]?.substring(0, vals[0]?.length - 2);
            const maxFromType = vals[1]?.substring(0, vals[1]?.length - 2);

            minTotal = minFromType > minTotal ? Number(minFromType) : minTotal;
            maxTotal = Number(maxFromType);
          }
          const valLessThanMin = valAsNumber < minTotal;
          const valMoreThanMax = !!maxTotal && valAsNumber > maxTotal;

          if (!maxTotal) {
            return val && valLessThanMin ? this.t('cluster.machineConfig.gce.error.diskSizeWithoutMax', { diskSizeMin: minTotal }) : undefined;
          } else {
            return val && (valLessThanMin || valMoreThanMax) ? this.t('cluster.machineConfig.gce.error.diskSizeWithMax', { diskSizeMin: minTotal, diskSizeMax: maxTotal }) : undefined;
          }
        }

      };
    },
    location() {
      return { zone: this.value.zone };
    },
    project() {
      return this.value.project;
    },

    sharedNetworks() {
      return formatSharedNetworks(this.sharedSubnetworks);
    },
    networkOptions() {
      const out = formatNetworkOptions(this.t, this.networks, this.subnetworks, this.sharedNetworks );

      return out;
    },

    subnetworkOptions() {
      return formatSubnetworkOptions(this.t, this.value.network, this.subnetworks, this.sharedNetworks, this.useIpAliases);
    },

    selectedNetwork: {
      get() {
        const { network } = this.value;

        if (this.isView) {
          return network;
        }
        if (!network) {
          return undefined;
        }

        return this.networkOptions.find((n) => n.name === network);
      },
      set(neu) {
        this.value.network = neu.name;
      }
    },

    selectedSubnetwork: {
      get() {
        const { subnetwork } = this.value;

        if (this.isView) {
          return subnetwork;
        }
        if (!subnetwork || subnetwork === '') {
          return { label: this.t('gke.subnetwork.auto'), name: GKE_NONE_OPTION };
        }

        return this.subnetworkOptions.find((n) => n.name === subnetwork);
      },
      set(neu) {
        if (neu.name === GKE_NONE_OPTION) {
          this.value.subnetwork = '';
        } else {
          this.value.subnetwork = neu.name;
        }
      }
    },
    diskType: {
      get() {
        return this.value?.diskType || '';
      },
      set(neu) {
        this.value.diskType = neu.name;
        this.diskSizeRequirementsFromType = neu.validDiskSize;
      }
    },
    tags: {
      get() {
        return this.value?.tags ? this.value.tags.split(',') : [];
      },
      set(neu) {
        this.value.tags = neu.toString();
      }
    },
    scopes: {
      get() {
        return this.value?.scopes ? this.value.scopes.split(',') : [];
      },
      set(neu) {
        this.value.scopes = neu.toString();
      }
    },
    labels: {
      get() {
        const labels = this.value.vmLabels || '';

        return convertStringToKV(labels);
      },
      set(neu) {
        this.value.vmLabels = convertKVToString(neu);
      }
    }
  },
  methods: {
    stringify,
    async getZones() {
      try {
        const res = await getGKEZones(this.$store, this.credentialId, this.project, {});

        this.zones = sortBy((res.items || []).map((z) => {
          z.disabled = z?.status?.toLowerCase() !== 'up';
          z.sortName = sortableNumericSuffix(z.name);

          return z.name;
        }), 'sortName', false);
      } catch (e) {
        this.errors.push(e.data);

        return '';
      }
    },

    async getDiskTypes() {
      this.loadingDiskTypes = true;
      try {
        const res = await getGKEDiskTypes(this.$store, this.credentialId, this.project, this.location);

        this.diskTypes = res.items.map((type) => {
          return { name: type.name, validDiskSize: type.validDiskSize };
        });
        const cur = this.diskTypes.find((el) => el.name === this.value.diskType);

        if (!cur ) {
          // If default is not actually available, reset
          if (this.poolCreateMode) {
            this.value.diskType = '';
          }
        } else {
          this.diskSizeRequirementsFromType = cur.validDiskSize;
        }
      } catch (e) {
        this.errors.push(e.data);
      }

      this.loadingDiskTypes = false;
    },
    async getNetworks() {
      this.loadingNetworks = true;
      try {
        const res = await getGKENetworks(this.$store, this.credentialId, this.project, this.location);

        this.networks = res?.items;
      } catch (e) {
        this.errors.push(e.data);
      }
      this.loadingNetworks = false;
    },
    async getSharedSubnetworks() {
      try {
        const res = await getGKESharedSubnetworks(this.$store, this.credentialId, this.project, this.location);

        this.sharedSubnetworks = res?.subnetworks || [];
      } catch (e) {
        this.errors.push(e.data);
      }
    },
    async getSubnetworks() {
      const region = `${ this.value.zone.split('-')[0] }-${ this.value.zone.split('-')[1] }`;

      try {
        const res = await getGKESubnetworks(this.$store, this.credentialId, this.project, { region });

        this.subnetworks = res?.items || [];
      } catch (e) {
        this.errors.push(e.data);
      }
    },
    async getMachineTypes() {
      this.loadingMachineTypes = true;
      try {
        const res = await getGKEMachineTypes(this.$store, this.credentialId, this.project, this.location);

        this.machineTypes = res?.items.map((type) => {
          return type.name;
        });
      } catch (e) {
        this.errors.push(e.data);
      }
      this.loadingMachineTypes = false;
    },

    async getOptions() {
      await this.getDiskTypes();
      await this.getMachineTypes();
      await this.getNetworks();
      // These can finish loading later
      this.getSubnetworks();
      this.getSharedSubnetworks();
    },
    closeError(index) {
      this.errors = this.errors.filter((_, i) => i !== index);
    }
  }
};
</script>

<template>
  <Loading
    v-if="$fetchState.pending"
    :delayed="true"
  />

  <div v-else>
    <div v-if="errors.length">
      <div
        v-for="(err, idx) in errors"
        :key="idx"
      >
        <Banner
          color="error"
          :label="stringify(err)"
          :closable="true"
          :data-testid="`gce-error-banner-${idx}`"
          @close="closeError(idx)"
        />
      </div>
    </div>
    <div>
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.zone"
          label-key="cluster.machineConfig.gce.location.zone.label"
          :mode="mode"
          :options="zones"

          :loading="loadingZones"
          data-testid="gce-zone-select"
          class="span-3 mr-10"
          required
        />
      </div>
      <GCEImage
        v-model:value="value.machineImage"
        :credentialId="credentialId"
        :projectId="value.project"
        :originalMachineImage="originalMachineImage"
        :pool-create-mode="poolCreateMode"
        :mode="mode"
        :location="location"
        :rules="{machineImage: fvGetAndReportPathRules('machineImage')}"
        @min-disk-changed="(val)=>minDiskFromImage=val"
        @error="(val)=>errors.push(val)"
      />

      <div class="row mt-20">
        <LabeledSelect
          v-model:value="diskType"
          label-key="cluster.machineConfig.gce.diskType.label"
          :mode="mode"
          :options="diskTypes"
          :loading="loadingDiskTypes"
          option-key="name"
          option-label="name"
          data-testid="gce-disk-type-select"
          required
          class="span-3 mr-10"
          :rules="fvGetAndReportPathRules('diskType')"
        />
        <LabeledInput
          v-model:value="value.diskSize"
          :mode="mode"
          label-key="cluster.machineConfig.gce.diskSize.label"
          :placeholder="50"
          data-testid="gce-disk-size-input"
          class="span-3 mr-10"
          required
          :rules="fvGetAndReportPathRules('diskSize')"
        />
        <LabeledSelect
          v-model:value="value.machineType"
          label-key="cluster.machineConfig.gce.machineType.label"
          :mode="mode"
          :options="machineTypes"
          :loading="loadingMachineTypes"
          data-testid="gce-machine-type-select"
          required
          :rules="fvGetAndReportPathRules('machineType')"
        />
      </div>
      <div class="row mt-20">
        <LabeledSelect
          v-model:value="selectedNetwork"
          label-key="cluster.machineConfig.gce.network.label"
          :mode="mode"
          :options="networkOptions"
          :disabled="!poolCreateMode"
          option-key="name"
          option-label="label"
          :loading="loadingNetworks"
          data-testid="gce-network-select"
          class="span-3 mr-10"
          required
          :rules="fvGetAndReportPathRules('network')"
        />
        <LabeledSelect
          v-model:value="selectedSubnetwork"
          label-key="cluster.machineConfig.gce.subnetwork.label"
          :mode="mode"
          :options="subnetworkOptions"
          :disabled="!poolCreateMode"
          option-key="name"
          option-label="name"
          :loading="loadingNetworks"
          data-testid="gce-subnetwork-select"
        />
      </div>
    </div>
    <portal :to="'advanced-' + uuid">
      <div class="row mt-20">
        <LabeledInput
          v-model:value="value.username"
          :mode="mode"
          label-key="cluster.machineConfig.gce.username.label"
          :placeholder="t('cluster.machineConfig.gce.username.placeholder')"
          :tooltip="t('cluster.machineConfig.gce.username.tooltip')"
          data-testid="gce-username-input"
          class="span-3 mr-10"
        />

        <LabeledInput
          v-model:value="value.address"
          :mode="mode"
          label-key="cluster.machineConfig.gce.address.label"
          :placeholder="t('cluster.machineConfig.gce.address.placeholder')"
          :tooltip="t('cluster.machineConfig.gce.address.tooltip')"
          data-testid="gce-address-input"
          class="span-3"
        />
      </div>
      <Checkbox
        v-model:value="value.preemptible"
        :mode="mode"
        :label="t('cluster.machineConfig.gce.preemptible.label')"
        :tooltip="t('cluster.machineConfig.gce.preemptible.tooltip')"
        class="mt-20"
      />

      <ArrayList
        v-model:value="scopes"
        table-class="fixed"
        :mode="mode"
        :title="t('cluster.machineConfig.gce.scopes.label')"
        :add-label="t('cluster.machineConfig.gce.scopes.add')"
        :disabled="disabled"
        class="col mt-20 span-10"
        data-testid="gce-scopes-array"
      />
      <h3 class="mt-20">
        {{ t('cluster.machineConfig.gce.firewall.header') }}
      </h3>
      <div class="row mt-20 span-12">
        <div class="col span-6">
          <Checkbox
            v-model:value="value.setInternalFirewallRulePrefix"
            :mode="mode"
            :label="t('cluster.machineConfig.gce.internalFirewall.label')"
            :tooltip="t('cluster.machineConfig.gce.internalFirewall.tooltip')"
            data-testid="gce-internal-firewall-prefix-checkbox"
          />
          <Banner
            color="info"
            label-key="cluster.machineConfig.gce.internalFirewall.banner"
            data-testid="gce-internal-firewall-banner"
          />
          <ArrayList
            v-model:value="tags"
            :mode="mode"
            :title="t('gke.tags.label')"
            :add-label="t('gke.tags.add')"
            class="col mr-10"
            data-testid="gce-tags-array"
          />
        </div>
        <div class="col span-6">
          <Checkbox
            v-model:value="value.setExternalFirewallRulePrefix"
            :mode="mode"
            :label="t('cluster.machineConfig.gce.externalFirewall.label')"
            :tooltip="t('cluster.machineConfig.gce.externalFirewall.tooltip')"
            data-testid="gce-external-firewall-prefix-checkbox"
          />
          <div v-if="!!value.setExternalFirewallRulePrefix">
            <Banner
              color="info"
              label-key="cluster.machineConfig.gce.externalFirewall.banner"
              data-testid="gce-external-firewall-banner"
            />
            <ArrayList
              v-model:value="value.openPort"
              :mode="mode"
              :title="t('cluster.machineConfig.gce.openPort.label')"
              :add-label="t('cluster.machineConfig.gce.openPort.add')"
              class="col"
              data-testid="gce-ports-array"
            />
          </div>
        </div>
      </div>
      <div class="mt-20">
        <h3>
          <t k="labels.labels.title" />
        </h3>
        <KeyValue
          v-model:value="labels"
          :mode="mode"
          :value-can-be-empty="true"
          :add-label="t('aks.nodePools.labels.add')"
          :read-allowed="false"
          data-testid="gce-labels-kv"
        />
      </div>
    </portal>
  </div>
</template>
