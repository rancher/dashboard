<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import { stringify, exceptionToErrorsArray } from '@shell/utils/error';
import { Banner } from '@components/Banner';
import merge from 'lodash/merge';
import isEmpty from 'lodash/isEmpty';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import ArrayList from '@shell/components/form/ArrayList';
import { randomStr } from '@shell/utils/string';
import { addParam, addParams } from '@shell/utils/url';
import { NORMAN } from '@shell/config/types';
import { findBy } from '@shell/utils/array';
import KeyValue from '@shell/components/form/KeyValue';
import { RadioGroup } from '@components/Form/Radio';
import { _CREATE, _EDIT } from '@shell/config/query-params';

export const azureEnvironments = [
  { value: 'AzurePublicCloud' },
  { value: 'AzureGermanCloud' },
  { value: 'AzureChinaCloud' },
  { value: 'AzureUSGovernmentCloud' },
];

const defaultConfig = {
  acceleratedNetworking: false,
  availabilitySet:       'docker-machine',
  clientId:              '',
  clientSecret:          '',
  customData:            '',
  diskSize:              '30',
  dns:                   '',
  environment:           'AzurePublicCloud',
  faultDomainCount:      '3',
  image:                 'canonical:UbuntuServer:18.04-LTS:latest',
  location:              'westus',
  managedDisks:          false,
  noPublicIp:            false,
  nsg:                   null,
  privateIpAddress:      null,
  resourceGroup:         'docker-machine',
  size:                  'Standard_D2_v2',
  sshUser:               'docker-user',
  staticPublicIp:        false,
  storageType:           'Standard_LRS',
  subnet:                'docker-machine',
  subnetPrefix:          '192.168.0.0/16',
  subscriptionId:        '',
  tenantId:              '',
  updateDomainCount:     '5',
  usePrivateIp:          false,
  vnet:                  'docker-machine-vnet',
  openPort:              [
    '6443/tcp',
    '2379/tcp',
    '2380/tcp',
    '8472/udp',
    '4789/udp',
    '9796/tcp',
    '10256/tcp',
    '10250/tcp',
    '10251/tcp',
    '10252/tcp',
  ],
  tags: null
};

const storageTypes = [
  {
    name:  'Standard LRS',
    value: 'Standard_LRS',
  },
  {
    name:  'Standard ZRS',
    value: 'Standard_ZRS',
  },
  {
    name:  'Standard GRS',
    value: 'Standard_GRS',
  },
  {
    name:  'Standard RAGRS',
    value: 'Standard_RAGRS',
  },
  {
    name:  'Premium LRS',
    value: 'Premium_LRS',
  },
  {
    name:  'Standard SSD LRS',
    value: 'StandardSSD_LRS'
  }
];

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
    RadioGroup
  },

  mixins: [CreateEditView, FormValidation],

  props: {
    credentialId: {
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
    this.initTags();

    try {
      const {
        clientId,
        clientSecret,
        environment,
        subscriptionId,
        tenantId,
      } = (this.credential?.decodedData || {});

      if (!isEmpty(clientId)) {
        this.value.clientId = clientId;
      }
      if (!isEmpty(clientSecret)) {
        this.value.clientSecret = clientSecret;
      }
      if (!isEmpty(environment)) {
        this.value.environment = environment;
      } else if (this.loadedCredentialIdFor !== this.credentialId) {
        this.allCredentials = await this.$store.dispatch('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL });

        const currentCredential = this.allCredentials.find((obj) => obj.id === this.credentialId);

        this.value.environment = currentCredential.azurecredentialConfig.environment;
      }
      if (!isEmpty(subscriptionId)) {
        this.value.subscriptionId = subscriptionId;
      }
      if (!isEmpty(tenantId)) {
        this.value.tenantId = tenantId;
      }

      if (this.loadedCredentialIdFor !== this.credentialId) {
        this.locationOptions = await this.$store.dispatch('management/request', {
          url:    addParam('/meta/aksLocations', 'cloudCredentialId', this.credentialId),
          method: 'GET',
        });

        this.loadedCredentialIdFor = this.credentialId;
      }

      // when you edit an Azure cluster and add a new machine pool (edit)
      // the location field doesn't come populated which causes the vmSizes request
      // to return 200 but with a null response (also a bunch of other fields are undefined...)
      // so let's prefill them with the defaults
      if (this.mode === _EDIT && !this.value?.location) {
        for (const key in this.defaultConfig) {
          if (this.value[key] === undefined) {
            this.value[key] = this.defaultConfig[key];
          }
        }
      }

      if (!this.value.location || !findBy(this.locationOptions, 'name', this.value.location)) {
        this.locationOptions?.length && this.setLocation(this.locationOptions[this.locationOptions.length - 1]);
      }

      this.vmSizes = await this.$store.dispatch('management/request', {
        url: addParams('/meta/aksVMSizesV2', {
          cloudCredentialId: this.credentialId,
          region:            this.value.location
        }),
        method: 'GET',
      });

      // set correct option for useAvailabilitySet (will consider correct state for UI form based on availabilitySet)
      if (this.mode === _CREATE) {
        this.useAvailabilitySet = true;
      } else {
        this.useAvailabilitySet = !!this.value.availabilitySet;
      }
    } catch (e) {
      this.errors = exceptionToErrorsArray(e);
    }
  },

  data() {
    return {
      azureEnvironments,
      defaultConfig,
      storageTypes,
      credential:         null,
      locationOptions:    [],
      loading:            false,
      useAvailabilitySet: false,
      vmSizes:            [],
      valueCopy:          this.value,

      loadedCredentialIdFor: null
    };
  },

  watch: {
    credentialId() {
      this.$fetch();
    },

    'value.location'() {
      this.$fetch();
    },

    'value.availabilityZone'(neu) {
      if (neu && (!this.value.managedDisks || !this.value.enablePublicIpStandardSku || !this.value.staticPublicIp)) {
        this.$emit('expandAdvanced');
      }
    }
  },

  computed: {
    locationOptionsInDropdown() {
      const locationOptionsCopy = [...this.locationOptions];

      return locationOptionsCopy.sort((a, b) => {
        // Hopefully it's easier to find a region if the list is in
        // alphabetical order.
        if (a.name > b.name) {
          return 1;
        }
        if (a.name < b.name) {
          return -1;
        }

        return 0;
      } )
        .map((option) => {
          return {
            displayName: `${ option.displayName } (${ option.name })`,
            name:        option.name,
          };
        });
    },
    vmsWithAcceleratedNetworking() {
      return this.vmSizes.filter((vmData) => {
        return vmData.AcceleratedNetworkingSupported;
      });
    },
    vmsWithoutAcceleratedNetworking() {
      return this.vmSizes.filter((vmData) => {
        return !vmData.AcceleratedNetworkingSupported;
      });
    },
    selectedVmSizeSupportsAN() {
      const selectedSizeIsValid = !!this.vmsWithAcceleratedNetworking.find((vmData) => {
        return this.value.size === vmData.Name;
      });

      return selectedSizeIsValid;
    },
    vmSizeAcceleratedNetworkingWarning() {
      if (!this.selectedVmSizeSupportsAN && this.value.acceleratedNetworking) {
        return this.t('cluster.machineConfig.azure.size.selectedSizeAcceleratedNetworkingWarning');
      }

      return '';
    },
    vmsWithAvailabilityZones() {
      return this.vmSizes.filter((vmData) => {
        return vmData.AvailabilityZones.length > 0;
      });
    },
    vmSizeAvailabilityWarning() {
      const selectedVmIsAvailableInSelectedRegion = this.vmSizes.filter((vmData) => {
        return vmData.Name === this.value.size;
      }).length > 0;

      if (!selectedVmIsAvailableInSelectedRegion) {
        return this.t('cluster.machineConfig.azure.size.availabilityWarning');
      }

      return '';
    },
    selectedVmSizeHasZones() {
      const dataForSelectedSize = this.vmsWithAvailabilityZones.filter((vmData) => {
        const { Name } = vmData;

        return Name === this.value.size;
      });

      if (dataForSelectedSize.length > 0) {
        return dataForSelectedSize[0].AvailabilityZones.length > 0;
      }

      return false;
    },
    vmAvailabilityZoneWarning() {
      if (this.useAvailabilitySet) {
        return '';
      }
      if (this.vmsWithAvailabilityZones.length === 0) {
        /**
         * Show UI warning: Availability zones are not supported in the selected
         * region. Please select a different region or use an
         * availability set instead.
         */
        return this.t('cluster.machineConfig.azure.size.regionDoesNotSupportAzs');
      }

      if (this.vmsWithAvailabilityZones.length > 0 && !this.selectedVmSizeHasZones) {
        /**
         * Show UI warning: The selected region does not support availability
         * zones for the selected VM size. Please select a
         * different region or VM size.
         */
        return this.t('cluster.machineConfig.azure.size.regionSupportsAzsButNotThisSize');
      }

      return '';
    },
    vmSizeOptionsForDropdown() {
      // example vmSize option from backend:
      // {
      //   AcceleratedNetworkingSupported: false,
      //   AvailabilityZones: [],
      //   Name: "Basic_A0"
      // }

      const out = [
        { kind: 'group', label: this.t('cluster.machineConfig.azure.size.supportsAcceleratedNetworking') },
        ...this.vmsWithAcceleratedNetworking,
        { kind: 'group', label: this.t('cluster.machineConfig.azure.size.doesNotSupportAcceleratedNetworking') },
        ...this.vmsWithoutAcceleratedNetworking,
      ];

      if (!this.selectedVmSizeExistsInSelectedRegion) {
        out.push({
          Name:     this.value.size,
          disabled: true
        });
      }

      return out.map((vmData) => {
        const { Name } = vmData;

        if (vmData.kind === 'group') {
          return vmData;
        }

        return {
          label:    Name,
          value:    Name,
          disabled: vmData.disabled || false,
        };
      });
    },
    selectedVmSizeExistsInSelectedRegion() {
      // If the user selects a region and then a VM size
      // that does not exist in the region, the list of VM
      // sizes will update, causing the selected VM size
      // to disappear. A disappearing VM size seems like a
      // bad UX, so this value allows the value to be
      // added to the VM size dropdown, while an error message
      // indicates that the size is invalid.
      if (this.vmSizes.find((size) => {
        return size.Name === this.value.size;
      })) {
        return true;
      }

      return false;
    },
    availableZones() {
      const data = this.vmSizes.filter((vmData) => {
        return vmData.Name === this.value.size;
      });

      if (data.length > 0) {
        return data[0].AvailabilityZones.sort((a, b) => {
          return a - b;
        });
      }

      return [];
    },
  },

  created() {
    if (this.mode === 'create') {
      for (const key in this.defaultConfig) {
        if (this.value[key] === undefined) {
          this.value[key] = this.defaultConfig[key];
        }
      }
      merge(this.value, this.defaultConfig);

      this.value.nsg = `rancher-managed-${ randomStr(8) }`;
    }
  },

  methods: {
    getVmSizeOptionLabel(vmData) {
      return vmData.label;
    },
    handleVmSizeInput($event) {
      if (this.vmSizeAcceleratedNetworkingWarning) {
        this.$emit('error', this.vmSizeAcceleratedNetworkingWarning);
      }
    },
    stringify,
    async getVmSizes() {
      this.loading = true;
      // The list of VM sizes should update when the
      // selected region is changed because different
      // VMs are supported in different regions.

      // Example vmSize option from backend:
      // {
      //   AcceleratedNetworkingSupported: false,
      //   AvailabilityZones: [],
      //   Name: "Basic_A0"
      // }
      try {
        this.vmSizes = await this.$store.dispatch('management/request', {
          url: addParams('/meta/aksVMSizesV2', {
            cloudCredentialId: this.credentialId,
            region:            this.value.location
          }),
          method: 'GET',
        });
      } catch (e) {
        this.errors = exceptionToErrorsArray(e);
      }
      this.loading = false;
    },
    setLocation(location) {
      this.value.location = location?.name;
      this.getVmSizes();
    },
    initTags() {
      const parts = (this.value.tags || '').split(/,/);
      const out = {};

      let i = 0;

      while ( i + 1 < parts.length ) {
        const key = `${ parts[i] }`.trim();
        const value = `${ parts[i + 1] }`.trim();

        if ( key ) {
          out[key] = value;
        }

        i += 2;
      }

      this.tags = out;
    },

    updateTags(tags) {
      const ary = [];

      for ( const k in tags ) {
        ary.push(k, tags[k]);
      }

      this.value['tags'] = ary.join(',');
    },
    handleAzChange() {
      if (this.value.availabilitySet) {
      // If an availability set exists, clear it out when
      // an availability zone is selected. Otherwise the
      // set will take precedent and the zone will not be saved.
        this.value.availabilitySet = null;
      }
    }
  },
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
    <div class="row mt-20">
      <div class="col span-6">
        <LabeledSelect
          :value="value.location"
          :mode="mode"
          :options="locationOptionsInDropdown"
          option-key="name"
          option-label="displayName"
          :searchable="true"
          :required="true"
          :label="t('cluster.machineConfig.azure.location.label')"
          :disabled="disabled"
          data-testid="machineConfig-azure-location"
          @update:value="setLocation"
        />
      </div>
      <div data-testid="machineConfig-azure-environment-value">
        <label
          v-clean-tooltip="t('cluster.machineConfig.azure.environment.tooltip')"
          :style="{'display':'block'}"
          class="text-label"
        >
          {{ t('cluster.machineConfig.azure.environment.label') }}
          <i class="icon icon-sm icon-info" />
        </label>
        <span>{{ value.environment }}</span>
      </div>
    </div>
    <div class="row mt-20">
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.resourceGroup"
          :mode="mode"
          :label="t('cluster.machineConfig.azure.resourceGroup.label')"
          :disabled="disabled"
        />
      </div>

      <div
        v-if="useAvailabilitySet"
        class="col span-4"
      >
        <LabeledInput
          v-model:value="value.availabilitySet"
          :mode="mode"
          :label="t('cluster.machineConfig.azure.availabilitySet.label')"
          :tooltip="t('cluster.machineConfig.azure.availabilitySet.description')"
          :disabled="disabled"
        />
      </div>
      <div
        v-if="!useAvailabilitySet"
        class="col span-4"
      >
        <i
          v-if="loading"
          class="icon icon-spinner delayed-loader"
        />
        <LabeledSelect
          v-else
          v-model:value="value.availabilityZone"
          :mode="mode"
          :options="availableZones"
          :label="t('cluster.machineConfig.azure.availabilityZone.label')"
          :tooltip="t('cluster.machineConfig.azure.availabilityZone.description')"
          :disabled="disabled || !!vmAvailabilityZoneWarning"
          @update:value="handleAzChange"
        />
        <Banner
          v-if="vmAvailabilityZoneWarning"
          color="error"
          :label="vmAvailabilityZoneWarning"
        />
      </div>
      <div class="col span-4">
        <RadioGroup
          v-model:value="useAvailabilitySet"
          name="etcd-s3"
          :options="[true, false]"
          :labels="[t('cluster.machineConfig.azure.availabilitySet.label'),t('cluster.machineConfig.azure.availabilityZone.label')]"
          :mode="mode"
        />
      </div>
    </div>
    <hr class="mt-20">
    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.image"
          :mode="mode"
          :label="t('cluster.machineConfig.azure.image.label')"
          :tooltip="t('cluster.machineConfig.azure.image.help')"
          :disabled="disabled"
        />
      </div>
      <div class="col span-6">
        <i
          v-if="loading"
          class="icon icon-spinner delayed-loader"
        />
        <LabeledSelect
          v-else
          v-model:value="value.size"
          :mode="mode"
          :options="vmSizeOptionsForDropdown"
          :get-option-label="getVmSizeOptionLabel"
          :searchable="true"
          :required="true"
          :label="t('cluster.machineConfig.azure.size.label')"
          :tooltip="value.acceleratedNetworking ? t('cluster.machineConfig.azure.size.tooltip') : ''"
          :disabled="disabled"
          @selecting="handleVmSizeInput"
        />
        <Banner
          v-if="vmSizeAcceleratedNetworkingWarning"
          color="error"
          :label="vmSizeAcceleratedNetworkingWarning"
        />
        <Banner
          v-else-if="vmSizeAvailabilityWarning"
          color="error"
          :label="vmSizeAvailabilityWarning"
        />
      </div>
    </div>

    <portal :to="'advanced-' + uuid">
      <div v-if="useAvailabilitySet">
        <h2>{{ t('cluster.machineConfig.azure.sections.availabilitySetConfiguration') }}</h2>
        <div class="row mt-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.faultDomainCount"
              :mode="mode"
              :label="t('cluster.machineConfig.azure.faultDomainCount.label')"
              :tooltip="t('cluster.machineConfig.azure.faultDomainCount.help')"
              :disabled="disabled"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.updateDomainCount"
              :mode="mode"
              :label="t('cluster.machineConfig.azure.updateDomainCount.label')"
              :tooltip="t('cluster.machineConfig.azure.updateDomainCount.help')"
              :disabled="disabled"
            />
          </div>
        </div>
      </div>
      <hr class="mt-20 mb-20">
      <h2>{{ t('cluster.machineConfig.azure.sections.purchasePlan') }}</h2>
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.plan"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.plan.label')"
            :placeholder="t('cluster.machineConfig.azure.plan.placeholder')"
            :disabled="disabled"
          />
        </div>
      </div>
      <hr class="mt-20">
      <h2>{{ t('cluster.machineConfig.azure.sections.network') }}</h2>
      <div class="row mt-20 mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.subnet"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.subnet.label')"
            :disabled="disabled"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.subnetPrefix"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.subnetPrefix.label')"
            :disabled="disabled"
          />
        </div>
      </div>
      <div class="row mt-20">
        <div class="col span-6">
          <Checkbox
            v-model:value="value.acceleratedNetworking"
            :disabled="(!value.acceleratedNetworking && !selectedVmSizeSupportsAN)"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.acceleratedNetworking.label')"
          />
          <Banner
            v-if="!selectedVmSizeSupportsAN && value.acceleratedNetworking"
            color="error"
            :label="t('cluster.machineConfig.azure.size.selectedSizeAcceleratedNetworkingWarning')"
          />
        </div>
      </div>
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.vnet"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.vnet.label')"
            :placeholder="t('cluster.machineConfig.azure.vnet.placeholder')"
            :disabled="disabled"
          />
        </div>
        <div class="col span-6 inline-banner-container">
          <h3><t k="cluster.machineConfig.azure.publicIpOptions.header" /></h3>
          <Checkbox
            v-model:value="value.noPublicIp"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.publicIpOptions.noPublic.label')"
          />
          <Checkbox
            v-model:value="value.staticPublicIp"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.publicIpOptions.staticPublicIp.label')"
          />
          <Checkbox
            v-model:value="value.enablePublicIpStandardSku"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.publicIpOptions.standardSKU.label')"
          />
          <div
            v-if="value.availabilityZone && (!value.staticPublicIp || !value.enablePublicIpStandardSku)"
            class="inline-error-banner"
          >
            <Banner
              v-if="!value.staticPublicIp && !value.enablePublicIpStandardSku"
              color="error"
              :label="t('cluster.machineConfig.azure.availabilityZone.publicIpAndSKUWarning')"
            />
            <Banner
              v-else-if="!value.staticPublicIp"
              color="error"
              :label="t('cluster.machineConfig.azure.availabilityZone.publicIpWarning')"
            />
            <Banner
              v-else
              color="error"
              :label="t('cluster.machineConfig.azure.availabilityZone.standardSKUWarning')"
            />
          </div>
        </div>
      </div>
      <div class="row mt-20">
        <div class="col span-6">
          <Checkbox
            v-model:value="value.usePrivateIp"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.usePrivateIp.label')"
          />
          <LabeledInput
            v-model:value="value.privateIpAddress"
            :mode="mode"
            class="mt-10"
            :label="t('cluster.machineConfig.azure.privateIp.label')"
            :disabled="!value.usePrivateIp"
          />
        </div>
      </div>
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.nsg"
            :mode="mode"
            class="mt-10"
            :label="t('cluster.machineConfig.azure.nsg.label')"
            :tooltip="t('cluster.machineConfig.azure.nsg.help')"
            :disabled="disabled"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.dns"
            :mode="mode"
            class="mt-10"
            :label="t('cluster.machineConfig.azure.dns.label')"
            :tooltip="t('cluster.machineConfig.azure.dns.help')"
            :disabled="disabled"
          />
        </div>
      </div>
      <hr class="mt-20 mb-20">
      <h2>{{ t('cluster.machineConfig.azure.sections.disks') }}</h2>
      <div class="row mt-20 mb-20">
        <div class="col span-6">
          <LabeledSelect
            v-model:value="value.storageType"
            :mode="mode"
            :options="storageTypes"
            :searchable="false"
            :required="true"
            :label="t('cluster.machineConfig.azure.storageType.label')"
            :disabled="disabled"
            option-key="value"
            option-label="name"
          />
          <Banner
            v-if="value.storageType === 'StandardSSD_LRS' && !value.managedDisks"
            color="error"
            :label="t('cluster.machineConfig.azure.storageType.warning')"
          />
        </div>
        <div class="col span-6 inline-banner-container">
          <Checkbox
            v-model:value="value.managedDisks"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.managedDisks.label')"
            :disabled="disabled"
          />
          <Banner
            v-if="value.availabilityZone && !value.managedDisks"
            color="error"
            :label="t('cluster.machineConfig.azure.availabilityZone.managedDisksWarning')"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.diskSize"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.managedDisksSize.label')"
            :disabled="disabled"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.sshUser"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.sshUser.label')"
            :disabled="disabled"
          />
        </div>
      </div>
      <div class="row mt-20">
        <div class="col span-6">
          <ArrayList
            v-model:value="value.openPort"
            table-class="fixed"
            :mode="mode"
            :title="t('cluster.machineConfig.azure.openPort.label')"
            :add-label="t('cluster.machineConfig.azure.openPort.add')"
            :show-protip="true"
            :protip="t('cluster.machineConfig.azure.openPort.help')"
            :disabled="disabled"
          />
        </div>
      </div>

      <div class="row mt-20">
        <div class="col span-12">
          <h3><t k="cluster.machineConfig.azure.tags.label" /></h3>
          <KeyValue
            :value="tags"
            :mode="mode"
            :read-allowed="false"
            :label="t('cluster.machineConfig.amazonEc2.tagTitle')"
            :add-label="t('labels.addTag')"
            :initial-empty-row="true"
            :disabled="disabled"
            @update:value="updateTags"
          />
        </div>
      </div>
    </portal>
  </div>
</template>

<style scoped>
.inline-banner-container{
  position: relative;
}
.inline-error-banner {
  position: absolute;
  width:100%
}
</style>
