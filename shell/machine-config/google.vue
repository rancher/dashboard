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

import { NORMAN } from '@shell/config/types';
import { findBy } from '@shell/utils/array';
import KeyValue from '@shell/components/form/KeyValue';

import {
  getGKEZones, getGKEImageFamilies, getGKEFamiliesFromProject, getGKEDiskTypes, getGKENetworks, getGKEMachineTypes, getGKESubnetworks, getGKESharedSubnetworks
} from '@pkg/gke/util/gcp';
import InputWithSelect from '@shell/components/form/InputWithSelect';
import { machine } from 'os';
import { formatSharedNetworks, formatNetworkOptions, formatSubnetworkOptions } from '@pkg/gke/util/formatter';
import { mapGetters } from 'vuex';
import { sortBy, sortableNumericSuffix } from '@shell/utils/sort';

// TODO VALIDATION
// TODO ERROR HANDLING

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
      }
    } catch (e) {
      this.credential = null;
    }
    console.log(this.value);

    for (const key in this.defaultConfig) {
      if (this.value[key] === undefined && !!this.defaultConfig[key]) {
        this.value[key] = this.defaultConfig[key];
      }
    }

    try {
      const res = await getGKEZones(this.$store, this.credentialId, this.project, {});

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
      // await this.getImages();
      await this.getFamilies();
      //   const machineImage = this.images['ubuntu-os-cloud'][0];

    //   this.machineImage = {
    //     name:     machineImage.name,
    //     selfLink: machineImage.selfLink,
    //     diskSize: machineImage.diskSizeGb
    //   };
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
      loadingFamilies:       false,
      useAvailabilitySet:    false,
      vmSizes:               [],
      valueCopy:             this.value,
      zones:                 [],
      families:              [],
      machineImages:         [],
      diskTypes:             [],
      networks:              [],
      subnetworks:           [],
      sharedSubnetworks:     [],
      machineTypes:          [],
      loadedCredentialIdFor: null,
      imageProjects1:        ['suse-cloud', 'ubuntu-os-cloud'],
      imageProjects:         'suse-cloud, ubuntu-os-cloud',
      // imageProject:          '',
      showDeprecated:        true,
      // minimumDiskSize:       10,
      family:                null,
      machineImage:          this.value?.machineImage ? this.value?.machineImage : '',
      // scopes:                ['https://www.googleapis.com/auth/devstorage.read_only', 'https://www.googleapis.com/auth/monitoring.write'], // convert on save
      // labels:                [], // convert on save
      useIpAliases:          false // TODO check if needed
    };
  },
  created() {
    if (this.mode === _CREATE) {
      this.value.project = this.projectId;
      for (const key in this.defaultConfig) {
        if (this.value[key] === undefined && !!this.defaultConfig[key]) {
          this.value[key] = this.defaultConfig[key];
        }
      }
      merge(this.value, this.defaultConfig);
    } else {
      this.imageProjects = this.getProjectFromImage();
    }
  },

  watch: {
    credentialId() {
      this.$fetch();
    },

    'value.zone'() {
      this.$fetch();
    },
    family(neu) {
      this.getImages(neu);
    },

    'value.availabilityZone'(neu) {
      if (neu && (!this.value.managedDisks || !this.value.enablePublicIpStandardSku || !this.value.staticPublicIp)) {
        this.$emit('expandAdvanced');
      }
    },
    'imageProjects'() {
      this.getFamilies();
    },
    machineImage(neu) {
      this.setMachineImage(neu);
    },
    showDeprecated(neu) {
      this.family = null;
      this.getFamilies();
      this.machineImages = [];
      this.machineImage = '';
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
    project() {
      return this.value.project;
    },
    familyOption() {
      const out = [];

      Object.keys(this.families).forEach((groupLabel) => {
        const instances = this.families[groupLabel];

        const groupOption = { label: groupLabel, kind: 'group' };
        const familyOptions = instances.map((instance) => {
          return {
            value: { family: instance, project: groupLabel },
            label: instance,
            group: groupLabel
          };
        });

        out.push(groupOption);
        out.push(...familyOptions);
      });

      return out;
    },
    imageOptions() {
      let out = [];

      if (!this.showDeprecated) {
        out = this.machineImages.map((image) => {
          const value = {
            name:     image.name,
            selfLink: image.selfLink,
            diskSize: image.diskSizeGb
          };
          const deprecated = !!image?.deprecated;

          return {
            value,
            label: !deprecated ? this.t('cluster.machineConfig.gce.machineImage.option', { name: image.name, description: image.description }) : this.t('cluster.machineConfig.gce.machineImage.deprecatedOption', { name: image.name, description: image.description }),
          };
        });
      } else {
        const deprecatedImages = [];
        const activeImages = [];

        this.machineImages.forEach((image) => {
          const value = {
            name:     image.name,
            selfLink: image.selfLink,
            diskSize: image.diskSizeGb
          };
          const deprecated = !!image?.deprecated;

          if (!deprecated) {
            activeImages.push({
              value,
              label: !deprecated ? this.t('cluster.machineConfig.gce.machineImage.option', { name: image.name, description: image.description }) : this.t('cluster.machineConfig.gce.machineImage.deprecatedOption', { name: image.name, description: image.description }),
            });
          } else {
            deprecatedImages.push({
              value,
              label: !deprecated ? this.t('cluster.machineConfig.gce.machineImage.option', { name: image.name, description: image.description }) : this.t('cluster.machineConfig.gce.machineImage.deprecatedOption', { name: image.name, description: image.description }),
            });
          }
          out = [...activeImages, ...deprecatedImages];
        });
      }

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
    getProjectFromImage() {
      if (!!this.value?.machineImage) {
        return this.value.machineImage.split('/')[0];
      }
    },
    getImageNameFromImage() {
      if (!!this.value?.machineImage) {
        return this.value.machineImage.split('/')[3];
      }
    },
    // TODO: error handling
    async getFamilies() {
      this.loadingFamilies = true;
      const projects = this.imageProjects.replace(/ /g, '');
      const out = await getGKEFamiliesFromProject(this.$store, this.credentialId, this.value.project, this.location, projects, false);

      if (!!this.showDeprecated) {
        const deprecatedResponse = await getGKEFamiliesFromProject(this.$store, this.credentialId, this.project, this.location, projects, true);

        Object.keys(deprecatedResponse).forEach((family) => {
          if ( !out[family]) {
            out[family] = family;
          } else {
            out[family] = [...new Set([...out[family], ...deprecatedResponse[family]])];
          }
        });
      }
      this.families = out;

      if (!!this.machineImage) {
        let found = false;

        const project = this.getProjectFromImage();
        const family = out[project] || [];
        const imageName = this.getImageNameFromImage();

        let count = 0;

        while (!found && count < family.length) {
          const images = await this.getImagesInProject({ family: family[count], project }, true );
          const filtered = images.filter((image) => image.name === imageName);

          if (filtered.length > 0) {
            found = true;
            this.family = filtered[0].family;
          }
          count += 1;
        }
      }

      this.loadingFamilies = false;
    },

    async getImagesInProject(val, showDeprecated) {
      let imagesInProject = [];

      if (val?.family) {
        imagesInProject = await getGKEImageFamilies(this.$store, this.credentialId, this.project, location, val.family, val.project, showDeprecated);
      }

      return imagesInProject;
    },

    async getImages(val) {
      this.loadingImages = true;

      this.machineImages = await this.getImagesInProject(val, this.showDeprecated);

      this.loadingImages = false;
    },

    async getDiskTypes() {
      this.loadingDiskTypes = true;
      try {
        const res = await getGKEDiskTypes(this.$store, this.credentialId, this.project, this.location);

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
        const res = await getGKENetworks(this.$store, this.credentialId, this.project, this.location);

        this.networks = res?.items;
      } catch (err) {
        this.$emit('error', err);
      }
      this.loadingNetworks = false;
    },
    async getSharedSubnetworks() {
      try {
        const res = await getGKESharedSubnetworks(this.$store, this.credentialId, this.project, this.location);

        this.sharedSubnetworks = res?.subnetworks || [];
      } catch (err) {
        this.$emit('error', err);
      }
    },
    async getSubnetworks() {
      const region = `${ this.value.zone.split('-')[0] }-${ this.value.zone.split('-')[1] }`;

      try {
        const res = await getGKESubnetworks(this.$store, this.credentialId, this.project, { region });

        this.subnetworks = res?.items || [];
      } catch (err) {
        this.$emit('error', err);
      }
    },
    async getMachineTypes() {
      this.loadingMachineTypes = true;
      try {
        const res = await getGKEMachineTypes(this.$store, this.credentialId, this.project, this.location);

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
      if (!image) {
        return '';
      }
      const index = image?.indexOf('/projects/');

      if (index === -1 ) {
        return '';
      }

      return image?.substring(index + '/projects/'.length);
    },
    setTags(val) {
      this.value.tags = val.toString();
    },
    setScopes(val) {
      this.value.scopes = val.toString();
    },
    // TODO
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
  <div v-else-if="errors.length">
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
  <div v-else>
    <div>
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.zone"
          label-key="cluster.machineConfig.gce.location.zone.label"
          :mode="mode"
          :options="zones"
          option-key="name"
          option-label="name"
          :loading="loadingZones"
          data-testid="gke-zone-select"
          class="span-3 mr-10"
          required
        />
      </div>
      <div class="row mt-20">
        <div class="col span-6 mr-10">
          <LabeledInput
            v-model:value="imageProjects"
            :mode="mode"
            label-key="cluster.machineConfig.gce.imageProjects.label"
            :placeholder="50"
            data-testid="gce-disk-size"
            required
          />
        </div>
        <div>
          <Checkbox
            v-model:value="showDeprecated"
            :mode="mode"
            :label="t('cluster.machineConfig.gce.showDeprecated.label')"
            class="mt-20"
          />
        </div>
      </div>
      <div class="row mt-20">
        <LabeledSelect
          v-model:value="family"
          label-key="cluster.machineConfig.gce.family.label"
          :mode="mode"
          :options="familyOption"
          option-key="value"
          option-label="label"
          :loading="loadingZones"
          data-testid="gke-zone-select"
          class="span-3 mr-10"
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
          class="span-3 mr-10"
          required
          @update:value="setMachineImage"
        />
      </div>
      <div class="row mt-20">
        <LabeledSelect
          v-model:value="value.diskType"
          label-key="cluster.machineConfig.gce.diskType.label"
          :mode="mode"
          :options="diskTypes"
          option-key="name"
          option-label="name"
          :loading="loadingDiskTypes"
          data-testid="gce-disk-type"
          required
          class="span-3 mr-10"
        />
        <LabeledInput
          v-model:value="value.diskSize"
          :mode="mode"
          label-key="cluster.machineConfig.gce.diskSize.label"
          :placeholder="50"
          data-testid="gce-disk-size"
          class="span-3 mr-10"
          required
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
          required
        />
      </div>
      <div class="row mt-20">
        <LabeledSelect
          v-model:value="value.network"
          label-key="cluster.machineConfig.gce.network.label"
          :mode="mode"
          :options="networkOptions"
          option-key="name"
          option-label="name"
          :loading="loadingNetworks"
          data-testid="gke-zone-select"
          class="span-3 mr-10"
          required
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
          data-testid="gce-disk-size"
          class="span-3 mr-10"
        />

        <LabeledInput
          v-model:value="value.address"
          :mode="mode"
          label-key="cluster.machineConfig.gce.address.label"
          :placeholder="t('cluster.machineConfig.gce.address.placeholder')"
          :tooltip="t('cluster.machineConfig.gce.address.tooltip')"
          data-testid="gce-disk-size"
          class="span-3 mr-10"
        />
        <LabeledInput
          v-model:value="value.userData"
          :mode="mode"
          label-key="cluster.machineConfig.gce.userdata.label"
          :placeholder="t('cluster.machineConfig.gce.userdata.placeholder')"
          :tooltip="t('cluster.machineConfig.gce.userdata.tooltip')"
          data-testid="gce-disk-size"
        />
      </div>
      <div class="row mt-20">
        <div class="col span-6 advanced-checkboxes">
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
            :label="t('cluster.machineConfig.gce.useInternalIPOnly.label')"
            :tooltip="t('cluster.machineConfig.gce.useInternalIPOnly.tooltip')"
          />
          <Checkbox
            v-model:value="value.useExisting"
            :mode="mode"
            :label="t('cluster.machineConfig.gce.useExisting.label')"
            :tooltip="t('cluster.machineConfig.gce.useExisting.tooltip')"
          />
        </div>
      </div>

      <ArrayList
        :value="scopes"
        table-class="fixed"
        :mode="mode"
        :title="t('cluster.machineConfig.gce.scopes.label')"
        :add-label="t('cluster.machineConfig.gce.scopes.add')"
        :disabled="disabled"
        class="col mt-20 span-10"
        @update:value="setScopes"
      />
      <div class="row mt-20 span-12">
        <ArrayList
          :value="tags"
          :mode="mode"
          :title="t('gke.tags.label')"
          :add-label="t('gke.tags.add')"
          class="col span-6 mr-10"
          @update:value="setTags"
        />
        <ArrayList
          v-model:value="value.openPort"
          :mode="mode"
          :title="t('cluster.machineConfig.gce.openPort.label')"
          :add-label="t('cluster.machineConfig.gce.openPort.add')"
          class="col span-6"
        />
      </div>
      <div class="mt-20">
        <h3>
          <t k="labels.labels.title" />
        </h3>
        <!-- <KeyValue
          v-model:value="labels"
          :mode="mode"
          :value-can-be-empty="true"
          :add-label="t('aks.nodePools.labels.add')"
          :read-allowed="false"
          data-testid="aks-node-labels-input"
        /> -->
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

.advanced-checkboxes {
  display: flex;
  flex-direction: column;
  &>*{
    margin-bottom: 10px;
  }
}

</style>
