<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { stringify } from '@shell/utils/error';
import { Banner } from '@components/Banner';
import merge from 'lodash/merge';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import ArrayList from '@shell/components/form/ArrayList';

import { NORMAN } from '@shell/config/types';
import { convertStringToKV, convertKVToString } from '@shell/utils/object';
import KeyValue from '@shell/components/form/KeyValue';
import {
  getGKEZones, getGKEImageFamilies, getGKEFamiliesFromProject, getGKEDiskTypes, getGKENetworks, getGKEMachineTypes, getGKESubnetworks, getGKESharedSubnetworks
} from '@pkg/gke/util/gcp';
import { formatSharedNetworks, formatNetworkOptions, formatSubnetworkOptions } from '@pkg/gke/util/formatter';
import { mapGetters } from 'vuex';
import { sortBy, sortableNumericSuffix } from '@shell/utils/sort';
import debounce from 'lodash/debounce';
const GKE_NONE_OPTION = 'none';
const DEFAULT_PROJECTS = 'suse-cloud, ubuntu-os-cloud';

const DEFAULT_MIN_DISK = 10;

const defaultConfig = {
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
  setInternalFirewallRulePrefix: false,
  setExternalFirewallRulePrefix: false
};

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
    await this.getZones();
    await this.getOptions();
  },

  data() {
    return {
      defaultConfig,
      credential:          null,
      images:              {},
      // loading:               false,
      loadingZones:        false,
      loadingDiskTypes:    false,
      loadingNetworks:     false,
      loadingImages:       false,
      loadingMachineTypes: false,
      loadingFamilies:     false,
      zones:               [],
      families:            {},
      machineImages:       [],
      diskTypes:           [],
      networks:            [],
      subnetworks:         [],
      sharedSubnetworks:   [],
      machineTypes:        [],
      imageProjects:       DEFAULT_PROJECTS,
      showDeprecated:      false,
      family:              null,
      useIpAliases:        false,
      minDisk:             DEFAULT_MIN_DISK,
      defaultProjects:     DEFAULT_PROJECTS,
      fvFormRuleSets:      [
        {
          path: 'imageProjects', rootObject: this, rules: ['required', 'projects']
        },
        {
          path: 'family', rootObject: this, rules: ['required']
        },
        {
          path: 'machineImage', rootObject: this, rules: ['required']
        },
        { path: 'diskType', rules: ['required'] },
        { path: 'diskSize', rules: ['required', 'isPositive', 'minDiskSize'] },
        { path: 'machineType', rules: ['required'] },
        { path: 'network', rules: ['required'] },
      ]
    };
  },
  created() {
    this.debouncedLoadFamilies = debounce(this.getFamilies, 500);
    if (this.mode === _CREATE) {
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
      this.imageProjects = `${ this.getProjectFromImage() }`;
    }
  },

  watch: {
    credentialId() {
      this.$fetch();
    },
    fvFormIsValid(newValue) {
      this.$emit('validationChanged', !!newValue);
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
      } else if (this.isCreate) {
        this.value.openPort.push('6443');
      }
    },
    family(neu) {
      this.getImages(neu);
    },

    'imageProjects'() {
      this.debouncedLoadFamilies();
    },

    showDeprecated() {
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
    fvExtraRules() {
      return {
        projects: (val) => {
          return val && !val.match(/^[a-zA-Z0-9 ,.-]*$/) ? this.t('cluster.machineConfig.gce.error.projects') : undefined;
        },

        minDiskSize: (val) => {
          return val && val < this.minDisk ? this.t('cluster.machineConfig.gce.error.diskSize', { diskSize: this.minDisk }) : undefined;
        }

      };
    },
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
    familyOptions() {
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
        return this.value?.machineImage ? this.getImageNameFromImage() : '';
      },
      set(neu) {
        this.setMachineImage(neu);
        this.diskSize = neu?.diskSize ? neu.diskSize : 10;
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

        // TODO Should consider moving this to the util function and check if we need regions similar to GKE
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

    async getFamilies() {
      this.loadingFamilies = true;
      let out = {};

      if (this.imageProjects) {
        try {
          let projects = this.imageProjects.replace(/ /g, '');

          if (projects.endsWith(',')) {
            projects = projects.substring(0, projects.length - 1 );
          }

          if (!!projects) {
            out = await getGKEFamiliesFromProject(this.$store, this.credentialId, this.value.project, this.location, projects, false) || {};

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
          }
        } catch (e) {
          // This fails often if user mistypes, so it's better to swallow the error instead of spamming with errors
          this.errors.push(e.data);

          return '';
        }
      }
      this.families = out;

      // When editing existing cluster, we need to find corresponding family
      if (!!this.value.machineImage) {
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
        // If we had to reload list of images, we need to reset selected image if it is no longer in the list
        if ( !!this.machineImage && this.machineImages.filter((image) => image.name === this.machineImage).length === 0) {
          this.machineImage = '';
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

    async getOptions() {
      await this.getDiskTypes();
      await this.getMachineTypes();
      await this.getNetworks();
      await this.getFamilies();
      // These can finish loading later
      this.getSubnetworks();
      this.getSharedSubnetworks();
    },
    closeError(index) {
      this.errors = this.errors.filter((_, i) => i !== index);
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
          :closable="true"
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
            :placeholder="defaultProjects"
            data-testid="gce-disk-size"
            required
            :rules="fvGetAndReportPathRules('imageProjects')"
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
          :options="familyOptions"
          option-key="value"
          option-label="label"
          :loading="loadingZones"
          data-testid="gke-zone-select"
          class="span-3 mr-10"
          :rules="fvGetAndReportPathRules('family')"
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
          :rules="fvGetAndReportPathRules('machineImage')"
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
          :rules="fvGetAndReportPathRules('diskType')"
        />
        <LabeledInput
          v-model:value="value.diskSize"
          :mode="mode"
          label-key="cluster.machineConfig.gce.diskSize.label"
          :placeholder="50"
          data-testid="gce-disk-size"
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
          data-testid="gke-zone-select"
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
          :disabled="!isCreate"
          option-key="name"
          option-label="label"
          :loading="loadingNetworks"
          data-testid="gke-zone-select"
          class="span-3 mr-10"
          required
          :rules="fvGetAndReportPathRules('network')"
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

      <ArrayList
        v-model:value="scopes"
        table-class="fixed"
        :mode="mode"
        :title="t('cluster.machineConfig.gce.scopes.label')"
        :add-label="t('cluster.machineConfig.gce.scopes.add')"
        :disabled="disabled"
        class="col mt-20 span-10"
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
        />
      </div>
    </portal>
  </div>
</template>
