<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import { stringify, exceptionToErrorsArray } from '@shell/utils/error';
import Banner from '@shell/components/Banner';
import merge from 'lodash/merge';
import isEmpty from 'lodash/isEmpty';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LabeledInput from '@shell/components/form/LabeledInput';
import Checkbox from '@shell/components/form/Checkbox';
import ArrayList from '@shell/components/form/ArrayList';
import { randomStr } from '@shell/utils/string';
import { addParam, addParams } from '@shell/utils/url';

export const azureEnvironments = [
  { value: 'AzurePublicCloud' },
  { value: 'AzureGermanCloud' },
  { value: 'AzureChinaCloud' },
  { value: 'AzureUSGovernmentCloud' },
];

const defaultConfig = {
  availabilitySet:   'docker-machine',
  clientId:          '',
  clientSecret:      '',
  customData:        '',
  diskSize:          '30',
  dns:               '',
  environment:       'AzurePublicCloud',
  faultDomainCount:  '3',
  image:             'canonical:UbuntuServer:18.04-LTS:latest',
  location:          'westus',
  managedDisks:      false,
  noPublicIp:        false,
  nsg:               null,
  privateIpAddress:  null,
  resourceGroup:     'docker-machine',
  size:              'Standard_D2_v2',
  sshUser:           'docker-user',
  staticPublicIp:    false,
  storageType:       'Standard_LRS',
  subnet:            'docker-machine',
  subnetPrefix:      '192.168.0.0/16',
  subscriptionId:    '',
  tenantId:          '',
  updateDomainCount: '5',
  usePrivateIp:      false,
  vnet:              'docker-machine-vnet',
  openPort:          [
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
];

export default {
  components: {
    ArrayList,
    Banner,
    Checkbox,
    LabeledInput,
    LabeledSelect,
    Loading,
  },

  mixins: [CreateEditView],

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
      }
      if (!isEmpty(subscriptionId)) {
        this.value.subscriptionId = subscriptionId;
      }
      if (!isEmpty(tenantId)) {
        this.value.tenantId = tenantId;
      }

      this.locationOptions = await this.$store.dispatch('management/request', {
        url:    addParam('/meta/aksLocations', 'cloudCredentialId', this.credentialId),
        method: 'GET',
      });

      this.vmSizes = await this.$store.dispatch('management/request', {
        url:    addParams('/meta/aksVMSizes', { cloudCredentialId: this.credentialId, region: 'westus' }),
        method: 'GET',
      });
    } catch (e) {
      this.errors = exceptionToErrorsArray(e);
    }
  },

  data() {
    return {
      azureEnvironments,
      defaultConfig,
      storageTypes,
      credential:      null,
      locationOptions: null,
      vmSizes:         null,
    };
  },

  watch: {
    credentialId() {
      this.$fetch();
    },
  },

  created() {
    if (this.mode === 'create') {
      merge(this.value, this.defaultConfig);

      this.value.nsg = `rancher-managed-${ randomStr(8) }`;
    }
  },

  methods: {
    stringify,
    setLocation(location) {
      this.value.location = location?.name;
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" :delayed="true" />
  <div v-else-if="errors.length">
    <div v-for="(err, idx) in errors" :key="idx">
      <Banner color="error" :label="stringify(err)" />
    </div>
  </div>
  <div v-else>
    <div class="row mt-20">
      <div class="col span-6">
        <LabeledSelect
          v-model="value.environment"
          :mode="mode"
          :options="azureEnvironments"
          option-key="value"
          option-label="value"
          :searchable="false"
          :required="true"
          :label="t('cluster.machineConfig.azure.environment.label')"
          :disabled="disabled"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          :value="value.location"
          :mode="mode"
          :options="locationOptions"
          option-key="name"
          option-label="displayName"
          :searchable="true"
          :required="true"
          :label="t('cluster.machineConfig.azure.location.label')"
          :disabled="disabled"
          @input="setLocation"
        />
      </div>
    </div>
    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.resourceGroup"
          :mode="mode"
          :label="t('cluster.machineConfig.azure.resourceGroup.label')"
          :disabled="disabled"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.availabilitySet"
          :mode="mode"
          :label="t('cluster.machineConfig.azure.availabilitySet.label')"
          :disabled="disabled"
        />
      </div>
    </div>
    <hr class="mt-20" />
    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.image"
          :mode="mode"
          :label="t('cluster.machineConfig.azure.image.label')"
          :tooltip="t('cluster.machineConfig.azure.image.help')"
          :disabled="disabled"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="value.size"
          :mode="mode"
          :options="vmSizes"
          :searchable="true"
          :required="true"
          :label="t('cluster.machineConfig.azure.size.label')"
          :disabled="disabled"
        />
      </div>
    </div>

    <portal :to="'advanced-' + uuid">
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model="value.faultDomainCount"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.faultDomainCount.label')"
            :tooltip="t('cluster.machineConfig.azure.faultDomainCount.help')"
            :disabled="disabled"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.updateDomainCount"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.updateDomainCount.label')"
            :tooltip="t('cluster.machineConfig.azure.updateDomainCount.help')"
            :disabled="disabled"
          />
        </div>
      </div>
      <hr class="mt-20" />
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model="value.plan"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.plan.label')"
            :placeholder="t('cluster.machineConfig.azure.plan.placeholder')"
            :disabled="disabled"
          />
        </div>
      </div>
      <hr class="mt-20" />
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model="value.subnet"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.subnet.label')"
            :disabled="disabled"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.subnetPrefix"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.subnetPrefix.label')"
            :disabled="disabled"
          />
        </div>
      </div>
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model="value.vnet"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.vnet.label')"
            :placeholder="t('cluster.machineConfig.azure.vnet.placeholder')"
            :disabled="disabled"
          />
        </div>
        <div class="col span-6">
          <h3><t k="cluster.machineConfig.azure.publicIpOptions.header" /></h3>
          <Checkbox
            v-model="value.noPublicIp"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.publicIpOptions.noPublic.label')"
          />
          <Checkbox
            v-model="value.staticPublicIp"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.publicIpOptions.staticPublicIp.label')"
          />
        </div>
      </div>
      <div class="row mt-20">
        <div class="col span-6">
          <Checkbox
            v-model="value.usePrivateIp"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.usePrivateIp.label')"
          />
          <LabeledInput
            v-model="value.privateIpAddress"
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
            v-model="value.nsg"
            :mode="mode"
            class="mt-10"
            :label="t('cluster.machineConfig.azure.nsg.label')"
            :tooltip="t('cluster.machineConfig.azure.nsg.help')"
            :disabled="disabled"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.dns"
            :mode="mode"
            class="mt-10"
            :label="t('cluster.machineConfig.azure.dns.label')"
            :tooltip="t('cluster.machineConfig.azure.dns.help')"
            :disabled="disabled"
          />
        </div>
      </div>
      <hr class="mt-20" />
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledSelect
            v-model="value.storageType"
            :mode="mode"
            :options="storageTypes"
            :searchable="false"
            :required="true"
            :label="t('cluster.machineConfig.azure.storageType.label')"
            :disabled="disabled"
            option-key="value"
            option-label="name"
          />
        </div>
      </div>
      <div class="row mt-20">
        <div class="col span-6">
          <Checkbox
            v-model="value.managedDisks"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.managedDisks.label')"
            :disabled="disabled"
          />
          <LabeledInput
            v-model="value.diskSize"
            :mode="mode"
            class="mt-10"
            :label="t('cluster.machineConfig.azure.managedDisksSize.label')"
            :disabled="disabled"
          />
        </div>
      </div>
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model="value.sshUser"
            :mode="mode"
            :label="t('cluster.machineConfig.azure.sshUser.label')"
            :disabled="disabled"
          />
        </div>
      </div>
      <div class="row mt-20">
        <div class="col span-6">
          <ArrayList
            v-model="value.openPort"
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
    </portal>
  </div>
</template>
