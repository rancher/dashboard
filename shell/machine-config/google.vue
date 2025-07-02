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
import { addObject, addObjects, findBy } from '@shell/utils/array';
import { convertStringToKV, convertKVArrayToString } from '@shell/utils/object';
import KeyValue from '@shell/components/form/KeyValue';
import {
  getGKEZones, getGKEImageFamilies, getGKEFamiliesFromProject, getGKEDiskTypes, getGKENetworks, getGKEMachineTypes, getGKESubnetworks, getGKESharedSubnetworks
} from '@pkg/gke/util/gcp';
import InputWithSelect from '@shell/components/form/InputWithSelect';
import { machine } from 'os';
import { formatSharedNetworks, formatNetworkOptions, formatSubnetworkOptions } from '@pkg/gke/util/formatter';
import { mapGetters } from 'vuex';
import { sortBy, sortableNumericSuffix } from '@shell/utils/sort';
const GKE_NONE_OPTION = 'none';
// TODO VALIDATION
// TODO ERROR HANDLING
// TODO FIX MACHINE IMAGE

const defaultConfig = {
  zone:                          'us-central1-a',
  machineImage:                  '', // 'ubuntu-os-cloud/global/images/ubuntu-2004-focal-v20250313',
  diskType:                      'pd-standard',
  network:                       '',
  subnetwork:                    '',
  // TODO convert scopes into string before saving
  // scopes:            'https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/monitoring.write', // https://www.googleapis.com/auth/logging,
  scopes:                        'https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write',
  machineType:                   'n1-standard-2',
  // username:     'docker-user',
  // project:                       'ei-container-ui-ux',
  // cloudCredentialId:          'cattle-global-data:cc-wmlgj',
  diskSize:                      '50',
  tags:                          '',
  address:                       '',
  // preemptible:                   false, // TODO maybe remove
  // useInternalIp:                 false,
  // useInternalIpOnly:             false,
  // useExisting:                   false,
  openPort:                      [],
  // userData:          '',
  labels:                        '',
  setInternalFirewallRulePrefix: false,
  setExternalFirewallRulePrefix: false

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
    poolId: {
      type:     String,
      required: true,
    },
    disabled: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    // this.errors = [];
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

    for (const key in this.defaultConfig) {
      if (this.value[key] === undefined && !!this.defaultConfig[key]) {
        this.value[key] = this.defaultConfig[key];
      }
    }

    // try {
    await this.getZones();
    await this.getDiskTypes();
    await this.getMachineTypes();
    await this.getNetworks();
    this.getSubnetworks();
    this.getSharedSubnetworks();
    await this.getFamilies();
    //   const machineImage = this.images['ubuntu-os-cloud'][0];

    //   this.machineImage = {
    //     name:     machineImage.name,
    //     selfLink: machineImage.selfLink,
    //     diskSize: machineImage.diskSizeGb
    //   };
    // } catch (e) {
    //   this.errors = exceptionToErrorsArray(e);
    // }
  },

  data() {
    console.log(this.value.machineImage);

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
      showDeprecated:        false,
      // minimumDiskSize:       10,
      family:                null,
      // machineImage:          { name: this.value?.machineImage ? getImageNameFromImage() : '' },
      // scopes:                [], // convert on save
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
      this.value.setInternalFirewallRulePrefix = !!this.value.internalFirewallRulePrefix;
      this.value.setExternalFirewallRulePrefix = !!this.value.externalFirewallRulePrefix;
      this.imageProjects = `${ this.getProjectFromImage() }`;
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
    'value.setExternalFirewallRulePrefix'(neu) {
      if (!neu) {
        this.value.openPort = [];
      } else if (this.isCreate) {
        this.value.openPort.push('6443');
      }
    },
    family(neu) {
      this.getImages(neu);
    },

    'imageProjects'() {
      this.getFamilies();
    },
    // machineImage(neu) {
    //   this.setMachineImage(neu);
    // },
    showDeprecated(neu) {
      this.getFamilies();
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
    // defaultUsername() {
    //   return DEFAULT_USERNAME;
    // },
    isView() {
      return this.mode === _VIEW;
    },
    isCreate() {
      return this.mode === _CREATE;
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
    machineImage: {
      get() {
        const name = this.value?.machineImage ? this.getImageNameFromImage() : '';

        return { name: this.value?.machineImage ? this.getImageNameFromImage() : '' };
      },
      set(neu) {
        this.setMachineImage(neu);
      }
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
    tags() {
      return this.value?.tags ? this.value.tags.split(',') : [];
    },
    scopes() {
      return this.value?.scopes ? this.value.scopes.split(',') : [];
    },
    labels() {
      const labels = typeof this.value?.labels === 'string' ? this.value.labels : '';

      return convertStringToKV(labels);
    }
  },
  methods: {
    stringify,
    async getZones() {
      try {
        const res = await getGKEZones(this.$store, this.credentialId, this.project, {});

        // TODO Should consider moving this to the util function and check if we need regions similar to GKE
        this.zones = sortBy((res.items || []).map((z) => {
          z.disabled = z?.status?.toLowerCase() !== 'up';
          z.sortName = sortableNumericSuffix(z.name);

          return z.name;
        }), 'sortName', false);
      } catch (e) {
        console.log(e);
        this.errors.push(e.data);

        return '';
      }
    },
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
      let out = [];

      if (this.imageProjects) {
        try {
          const projects = this.imageProjects.replace(/ /g, '');

          out = await getGKEFamiliesFromProject(this.$store, this.credentialId, this.value.project, this.location, projects, false);

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
        } catch (e) {
          this.errors.push(e.data);

          return '';
        }
      }
      this.families = out;

      // When editing existing cluster, we need to find corresponding family
      console.log(this.machineImage);
      if (!!this.machineImage) {
        let found = false;

        const project = this.getProjectFromImage();
        const families = out[project] || [];
        const imageName = this.getImageNameFromImage();

        let count = 0;

        while (!found && count < families.length) {
          const images = await this.getImagesInProject({ family: families[count], project }, true );
          const filtered = images.filter((image) => image.name === imageName);

          if (filtered.length > 0) {
            found = true;
            this.family = { family: filtered[0].family, project };
          }
          count += 1;
        }
      }
      // If we had to reload list of families, we need to reset selected family if it is no longer in the list
      if ( !!this.family?.project && !this.families[this.family.project]) {
        this.family = null;
      }

      this.loadingFamilies = false;
    },

    async getImagesInProject(val, showDeprecated) {
      let imagesInProject = [];

      try {
        if (val?.family) {
          imagesInProject = await getGKEImageFamilies(this.$store, this.credentialId, this.project, location, val.family, val.project, showDeprecated);
        }
      } catch (e) {
        this.errors.push(e.data);
      }

      return imagesInProject;
    },

    async getImages(val) {
      this.loadingImages = true;
      try {
        this.machineImages = await this.getImagesInProject(val, this.showDeprecated);
        console.log(this.machineImage, this.machineImages);
        // If we had to reload list of images, we need to reset selected image if it is no longer in the list

        if ( !!this.machineImage && this.machineImages.filter((image) => image.name === this.machineImage?.name).length === 0) {
          this.machineImage = null;
        }
      } catch (e) {
        this.errors.push(e.data);
      }

      this.loadingImages = false;
    },

    async getDiskTypes() {
      this.loadingDiskTypes = true;
      try {
        const res = await getGKEDiskTypes(this.$store, this.credentialId, this.project, this.location);

        this.diskTypes = res.items.map((type) => {
          return type.name;
        });
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
    setLabels(val) {
      this.value.labels = convertKVArrayToString(val);
    },
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
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.zone"
          label-key="cluster.machineConfig.gce.location.zone.label"
          :mode="mode"
          :options="zones"

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
          class="span-3"
          :tooltip="t('cluster.machineConfig.gce.machineImage.tooltip')"
          required
        />
      </div>
      <div class="row mt-20">
        <LabeledSelect
          v-model:value="value.diskType"
          label-key="cluster.machineConfig.gce.diskType.label"
          :mode="mode"
          :options="diskTypes"
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
          :loading="loadingMachineTypes"
          data-testid="gke-zone-select"
          required
        />
      </div>
      <div class="row mt-20">
        <LabeledSelect
          v-model:value="selectedNetwork"
          label-key="cluster.machineConfig.gce.network.label"
          :mode="mode"
          :options="networkOptions"
          :disabled="!isCreate"
          option-key="name"
          option-label="label"
          :loading="loadingNetworks"
          data-testid="gke-zone-select"
          class="span-3 mr-10"
          required
        />
        <LabeledSelect
          v-model:value="selectedSubnetwork"
          label-key="cluster.machineConfig.gce.subnetwork.label"
          :mode="mode"
          :options="subnetworkOptions"
          :disabled="!isCreate"
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
          class="span-3"
        />
      </div>
      <!-- <div class="row mt-20">
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
      </div> -->

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
        <div class="col span-6">
          <Checkbox
            v-model:value="value.setInternalFirewallRulePrefix"
            :mode="mode"
            :label="t('cluster.machineConfig.gce.internalFirewall.label')"
            :tooltip="t('cluster.machineConfig.gce.internalFirewall.tooltip')"
          />
          <Banner
            color="info"
            label-key="cluster.machineConfig.gce.internalFirewall.banner"
          />
          <ArrayList
            :value="tags"
            :mode="mode"
            :title="t('gke.tags.label')"
            :add-label="t('gke.tags.add')"
            class="col span-6 mr-10"
            @update:value="setTags"
          />
        </div>
        <div class="col span-6">
          <Checkbox
            v-model:value="value.setExternalFirewallRulePrefix"
            :mode="mode"
            :label="t('cluster.machineConfig.gce.externalFirewall.label')"
            :tooltip="t('cluster.machineConfig.gce.externalFirewall.tooltip')"
          />
          <div v-if="!!value.setExternalFirewallRulePrefix">
            <Banner
              color="info"
              label-key="cluster.machineConfig.gce.externalFirewall.banner"
            />
            <ArrayList
              v-model:value="value.openPort"
              :mode="mode"
              :title="t('cluster.machineConfig.gce.openPort.label')"
              :add-label="t('cluster.machineConfig.gce.openPort.add')"
              class="col span-6"
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
          data-testid="aks-node-labels-input"
          @update:value="setLabels"
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

.advanced-checkboxes {
  display: flex;
  flex-direction: column;
  &>*{
    margin-bottom: 10px;
  }
}

</style>
