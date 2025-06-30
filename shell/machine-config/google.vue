<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import { _CREATE, _VIEW, _EDIT } from '@shell/config/query-params';
import { stringify, exceptionToErrorsArray } from '@shell/utils/error';
import { Banner } from '@components/Banner';
import merge from 'lodash/merge';
import isEmpty from 'lodash/isEmpty';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import ArrayList from '@shell/components/form/ArrayList';
import StringList from '@components/StringList/StringList.vue';
import { randomStr } from '@shell/utils/string';
import { addParam, addParams } from '@shell/utils/url';
import { NORMAN } from '@shell/config/types';
import { findBy } from '@shell/utils/array';
import KeyValue from '@shell/components/form/KeyValue';
import { RadioGroup } from '@components/Form/Radio';
import Cloudcredential from 'edit/cloudcredential.vue';
import {
  getGKEZones, getGKEImageFamilies, getGKEFamiliesFromProject, getGKEDiskTypes, getGKENetworks, getGKEMachineTypes, getGKESubnetworks, getGKESharedSubnetworks
} from '@pkg/gke/util/gcp';
import { sortBy, sortableNumericSuffix } from '@shell/utils/sort';
import InputWithSelect from '@shell/components/form/InputWithSelect';
import { machine } from 'os';
import { formatSharedNetworks, formatNetworkOptions, formatSubnetworkOptions } from '@pkg/gke/util/formatter';
import { mapGetters } from 'vuex';

// TODO VALIDATION
// TODO FIX LONG INIT LOADING
const defaultConfig = {
  zone:              'us-central1-a',
  machineImage:      'ubuntu-os-cloud/global/images/ubuntu-2004-focal-v20250313',
  diskType:          'pd-standard',
  network:           'eva-network', // 'default',
  subnetwork:        '',
  // TODO convert scopes into string before saving
  scopes:            'https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/monitoring.write', // https://www.googleapis.com/auth/logging,
  machineType:       'n1-standard-2',
  // username:     'docker-user',
  project:           'ei-container-ui-ux',
  // cloudCredentialId:          'cattle-global-data:cc-wmlgj',
  diskSize:          '50',
  tags:              '',
  address:           '',
  preemptible:       false, // TODO maybe remove
  useInternalIp:     false,
  useInternalIpOnly: false,
  useExisting:       false,
  openPort:          [],
  userData:          '',
  labels:            ''
  // internalFirewallRulePrefix: 'eva-test-6',
  // externalFirewallRulePrefix: 'eva-6-1'

  //   subnetwork:                 null,
  //   address:                    null,
  //   tags:                       '',
  //   openPort:                   null,
  //   userdata:                   null,
  //   externalFirewallRulePrefix: null,
  //   internalFirewallRulePrefix: null,
  // labels: {},
};
// const DEFAULT_USERNAME = 'docker-user';

export default {
  emits: ['expandAdvanced', 'error'],

  components: {
    ArrayList,
    Banner,
    Checkbox,
    KeyValue,
    LabeledInput,
    LabeledSelect,
    Loading,
    RadioGroup,
    StringList,
    InputWithSelect
  },

  mixins: [CreateEditView, FormValidation],

  props: {
    credentialId: {
      type:     String,
      required: true,
    },
    projectId: {
      type:     String,
      required: true,
    },
    mode: {
      type:    String,
      default: 'create',
    },
    uuid: {
      type:     String,
      required: true,
    },
    disabled: {
      type:    Boolean,
      default: false
    },
  },

  async fetch() {
    this.errors = [];
    if ( !this.credentialId ) {
      return;
    }

    try {
      if ( this.credential?.id !== this.credentialId ) {
        this.credential = await this.$store.dispatch('rancher/find', { type: NORMAN.CLOUD_CREDENTIAL, id: this.credentialId });
        // this.allCredentials = await this.$store.dispatch('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL });

        // currentCredential = this.allCredentials.find((obj) => obj.id === this.credentialId);
        // const config = JSON.parse(this.credential || '{}');
      }
    } catch (e) {
      this.credential = null;
    }

    for (const key in this.defaultConfig) {
      if (this.value[key] === undefined && !!this.defaultConfig[key]) {
        this.value[key] = this.defaultConfig[key];
      }
    }

    try {
      const res = await getGKEZones(this.$store, this.credentialId, this.projectId, {});

      // TODO Should consider moving this to the util function and check if we need regions similar to GKE
      this.zones = sortBy((res.items || []).map((z) => {
        z.disabled = z?.status?.toLowerCase() !== 'up';
        z.sortName = sortableNumericSuffix(z.name);

        return z;
      }), 'sortName', false);
      await this.getDiskTypes();
      await this.getMachineTypes();
      await this.getNetworks();
      this.getSubnetworks();
      this.getSharedSubnetworks();
      await this.getImages();
      const machineImage = this.images['ubuntu-os-cloud'][0];

      this.machineImage = {
        name:     machineImage.name,
        selfLink: machineImage.selfLink,
        diskSize: machineImage.diskSizeGb
      };
    } catch (e) {
      this.$emit('error', e);
      this.zones = [];
    }
  },

  data() {
    return {
      defaultConfig,
      // storageTypes,
      credential:            null,
      locationOptions:       [],
      images:                {},
      loading:               false,
      loadingZones:          false,
      loadingDiskTypes:      false,
      loadingNetworks:       false,
      loadingImages:         false,
      loadingMachineTypes:   false,
      useAvailabilitySet:    false,
      vmSizes:               [],
      valueCopy:             this.value,
      zones:                 [],
      machineImages:         [],
      diskTypes:             [],
      networks:              [],
      subnetworks:           [],
      sharedSubnetworks:     [],
      machineTypes:          [],
      loadedCredentialIdFor: null,
      imageProjects1:        ['suse-cloud', 'ubuntu-os-cloud'],
      imageProjects:         'suse-cloud, ubuntu-os-cloud',
      imageProject:          '',
      showDeprecated:        false,
      // minimumDiskSize:       10,
      machineImage:          {},
      // scopes:                ['https://www.googleapis.com/auth/devstorage.read_only', 'https://www.googleapis.com/auth/monitoring.write'], // convert on save
      // labels:                [], // convert on save
      useIpAliases:          false // TODO check if needed
    };
  },
  created() {
    if (this.mode === _CREATE) {
      for (const key in this.defaultConfig) {
        if (this.value[key] === undefined && !!this.defaultConfig[key]) {
          this.value[key] = this.defaultConfig[key];
        }
      }
      merge(this.value, this.defaultConfig);
    }
  },

  watch: {
    credentialId() {
      this.$fetch();
    },

    'value.zone'() {
      this.$fetch();
    },

    'value.availabilityZone'(neu) {
      if (neu && (!this.value.managedDisks || !this.value.enablePublicIpStandardSku || !this.value.staticPublicIp)) {
        this.$emit('expandAdvanced');
      }
    },
    'imageProjects'(neu) {
      this.getImages();
    },
    machineImage(neu) {
      this.setMachineImage(neu);
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    // defaultUsername() {
    //   return DEFAULT_USERNAME;
    // },
    isView() {
      return this.mode === _VIEW;
    },
    location() {
      return { zone: this.value.zone };
    },
    imageOptions() {
      const out = [];

      Object.keys(this.images).forEach((groupLabel) => {
        const instances = this.images[groupLabel];
        const groupOption = { label: groupLabel, kind: 'group' };
        const imageOptions = instances.map((instance) => {
          const value = {
            name:     instance.name,
            selfLink: instance.selfLink,
            diskSize: instance.diskSizeGb
          };

          return {
            value,
            label: `${ instance.name } - ${ instance.description }`,
            group: groupLabel
          };
        });

        out.push(groupOption);
        out.push(...imageOptions);
      });

      return out;
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
    tags() {
      return this.value?.tags ? this.value.tags.split(',') : [];
    },
    scopes() {
      return this.value?.tags ? this.value.scopes.split(',') : [];
    },
    labels() { // TODO
      return this.value?.labels ? [] : [];
    }
  },
  methods: {
    // TODO: error handling
    async getImages() {
      this.loadingImages = true;
      const projects = this.imageProjects.replace(/ /g, '');
      const familiesResponse = await getGKEFamiliesFromProject(this.$store, this.credentialId, this.projectId, this.location, projects, this.showDeprecated);
      const projectsSplit = projects.split(',');
      const images = {};

      for (const project of projectsSplit) {
        const families = familiesResponse[project].join(',');

        const imagesInProject = await getGKEImageFamilies(this.$store, this.credentialId, this.projectId, location, families, project, this.showDeprecated);

        images[project] = imagesInProject;
      }
      this.images = images;
      this.loadingImages = false;
    },

    async getDiskTypes() {
      this.loadingDiskTypes = true;
      try {
        const res = await getGKEDiskTypes(this.$store, this.credentialId, this.projectId, this.location);

        this.diskTypes = res.items.map((type) => {
          return { name: type.name };
        });
      } catch (e) {
        this.$emit('error', e);
      }

      this.loadingDiskTypes = false;
    },
    async getNetworks() {
      this.loadingNetworks = true;
      try {
        const res = await getGKENetworks(this.$store, this.credentialId, this.projectId, this.location);

        this.networks = res?.items;
      } catch (err) {
        this.$emit('error', err);
      }
      this.loadingNetworks = false;
    },
    async getSharedSubnetworks() {
      try {
        const res = await getGKESharedSubnetworks(this.$store, this.credentialId, this.projectId, this.location);

        this.sharedSubnetworks = res?.subnetworks || [];

        // this.sharedSubnetworks = formatSharedNetworks(allSharedSubnetworks);
      } catch (err) {
        this.$emit('error', err);
      }
    },
    async getSubnetworks() {
      const region = `${ this.value.zone.split('-')[0] }-${ this.value.zone.split('-')[1] }`;

      try {
        const res = await getGKESubnetworks(this.$store, this.credentialId, this.projectId, { region });

        this.subnetworks = res?.items || [];
      } catch (err) {
        this.$emit('error', err);
      }
    },
    async getMachineTypes() {
      this.loadingMachineTypes = true;
      try {
        const res = await getGKEMachineTypes(this.$store, this.credentialId, this.projectId, this.location);

        this.machineTypes = res?.items;
      } catch (err) {
        this.$emit('error', err);
      }
      this.loadingMachineTypes = false;
    },
    setMachineImage(neu) {
      this.value.machineImage = this.formatMachineImage(neu?.selfLink);
    },
    formatMachineImage(image) {
      const index = image?.indexOf('/projects/');

      if (index === -1 ) {
        return null;
      }

      return image.substring(index + '/projects/'.length);
    },
    setTags(val) {
      this.value.tags = val.toString();
    },
    setScopes(val) {
      this.value.scopes = val.toString();
    },
    setLabels(val) {
      console.log(val);
      this.value.labels = '';// val.toString();
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
        />
      </div>
    </div>
    <div>
      <LabeledSelect
        v-model:value="value.zone"
        label-key="cluster.machineConfig.gce.location.zone.label"
        :mode="mode"
        :options="zones"
        option-key="name"
        option-label="name"
        :loading="loadingZones"
        data-testid="gke-zone-select"
      />
      <LabeledInput
        v-model:value="imageProjects"
        :mode="mode"
        label-key="cluster.machineConfig.gce.imageProjects.label"
        :placeholder="50"
        data-testid="gce-disk-size"
      />
      <Checkbox
        v-model:value="showDeprecated"
        :mode="mode"
        :label="t('cluster.machineConfig.gce.useInternalIP.label')"
        :tooltip="t('cluster.machineConfig.gce.useInternalIP.tooltip')"
      />
      <LabeledSelect
        v-model:value="machineImage"
        label-key="cluster.machineConfig.gce.machineImage.label"
        :mode="mode"
        :options="imageOptions"
        option-key="value"
        option-label="label"
        :loading="loadingImages"
        data-testid="gce-disk-type"
        @update:value="setMachineImage"
      />
      <LabeledSelect
        v-model:value="value.diskType"
        label-key="cluster.machineConfig.gce.diskType.label"
        :mode="mode"
        :options="diskTypes"
        option-key="name"
        option-label="name"
        :loading="loadingDiskTypes"
        data-testid="gce-disk-type"
      />
      <LabeledInput
        v-model:value="value.diskSize"
        :mode="mode"
        label-key="cluster.machineConfig.gce.diskSize.label"
        :placeholder="50"
        data-testid="gce-disk-size"
      />
      <LabeledSelect
        v-model:value="value.network"
        label-key="cluster.machineConfig.gce.network.label"
        :mode="mode"
        :options="networkOptions"
        option-key="name"
        option-label="name"
        :loading="loadingNetworks"
        data-testid="gke-zone-select"
      />
      <LabeledSelect
        v-model:value="value.subnetwork"
        label-key="cluster.machineConfig.gce.subnetwork.label"
        :mode="mode"
        :options="subnetworkOptions"
        option-key="name"
        option-label="name"
        :loading="loadingNetworks"
        data-testid="gke-zone-select"
      />
      <LabeledSelect
        v-model:value="value.machineType"
        label-key="cluster.machineConfig.gce.machineType.label"
        :mode="mode"
        :options="machineTypes"
        option-key="name"
        option-label="name"
        :loading="loadingMachineTypes"
        data-testid="gke-zone-select"
      />
    </div>
    <portal :to="'advanced-' + uuid">
      <ArrayList
        :value="scopes"
        table-class="fixed"
        :mode="mode"
        :title="t('cluster.machineConfig.gce.scopes.label')"
        :add-label="t('cluster.machineConfig.gce.scopes.add')"
        :disabled="disabled"
        @update:value="setScopes"
      />
      <LabeledInput
        v-model:value="value.username"
        :mode="mode"
        label-key="cluster.machineConfig.gce.username.label"
        :placeholder="t('cluster.machineConfig.gce.username.placeholder')"
        :tooltip="t('cluster.machineConfig.gce.username.tooltip')"
        data-testid="gce-disk-size"
      />

      <LabeledInput
        v-model:value="value.address"
        :mode="mode"
        label-key="cluster.machineConfig.gce.address.label"
        :placeholder="t('cluster.machineConfig.gce.address.placeholder')"
        :tooltip="t('cluster.machineConfig.gce.address.tooltip')"
        data-testid="gce-disk-size"
      />
      <LabeledInput
        v-model:value="value.userData"
        :mode="mode"
        label-key="cluster.machineConfig.gce.userData.label"
        :placeholder="t('cluster.machineConfig.gce.userData.placeholder')"
        :tooltip="t('cluster.machineConfig.gce.userData.tooltip')"
        data-testid="gce-disk-size"
      />
      <Checkbox
        v-model:value="value.preemptible"
        :mode="mode"
        :label="t('cluster.machineConfig.gce.preemptible.label')"
        :tooltip="t('cluster.machineConfig.gce.preemptible.tooltip')"
      />
      <Checkbox
        v-model:value="value.useInternalIp"
        :mode="mode"
        :label="t('cluster.machineConfig.gce.useInternalIP.label')"
        :tooltip="t('cluster.machineConfig.gce.useInternalIP.tooltip')"
      />
      <Checkbox
        v-model:value="value.useInternalIpOnly"
        :mode="mode"
        :label="t('cluster.machineConfig.gce.useInternalIP.label')"
        :tooltip="t('cluster.machineConfig.gce.useInternalIP.tooltip')"
      />
      <Checkbox
        v-model:value="value.useInternalIpOnly"
        :mode="mode"
        :label="t('cluster.machineConfig.gce.useInternalIP.label')"
        :tooltip="t('cluster.machineConfig.gce.useInternalIP.tooltip')"
      />
      <Checkbox
        v-model:value="value.useExisting"
        :mode="mode"
        :label="t('cluster.machineConfig.gce.useExisting.label')"
        :tooltip="t('cluster.machineConfig.gce.useExisting.tooltip')"
      />
      <ArrayList
        :value="tags"
        :mode="mode"
        :title="t('gke.tags.label')"
        :add-label="t('gke.tags.add')"
        @update:value="setTags"
      />
      <ArrayList
        v-model:value="value.openPort"
        :mode="mode"
        :title="t('cluster.machineConfig.gce.openPort.label')"
        :add-label="t('cluster.machineConfig.gce.openPort.add')"
      />
      <div>
        <div class="text-label">
          {{ t('labels.labels.title') }}
          <i
            v-clean-tooltip="t('aks.nodePools.labels.tooltip')"
            class="icon icon-info"
          />
        </div>
        <KeyValue
          v-model:value="labels"
          :mode="mode"
          :value-can-be-empty="true"
          :add-label="t('aks.nodePools.labels.add')"
          :read-allowed="false"
          data-testid="aks-node-labels-input"
        />
      </div>
    </portal>
  </div>
</template>

<style scoped>
.inline-banner-container {
    position: relative;
}

.inline-error-banner {
    position: absolute;
    width: 100%
}
</style>
