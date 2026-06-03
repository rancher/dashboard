<!-- eslint-disable no-console -->
<script lang="ts">
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import CreateEditView from '@shell/mixins/create-edit-view';
import { HTTP_TOKENS_VALUES } from './constants';
import { NORMAN } from '@shell/config/types';
// import { allHash } from '@shell/utils/promise';
import { convertStringToKV, convertKVToString, isEmpty } from '@shell/utils/object';
import { stringify, exceptionToErrorsArray, formatAWSError } from '@shell/utils/error';
import { _CREATE } from '@shell/config/query-params';
import InstanceConfigSection from './InstanceConfigSection.vue';
import StorageSection from './StorageSection.vue';
import AdvancedSection from './AdvancedSection.vue';
import merge from 'lodash/merge';
import { removeEmptyFields } from '../utils';

const DEFAULT_GROUP = 'rancher-nodes';
const defaultConfig = {
  spec: {
    template: {
      spec: {
        // spec: {
        additionalSecurityGroups: [],
        additionalTags:           {},
        ami:                      { id: 'ami-0d13e2317a7e75c95' },
        cloudInit:                { insecureSkipSecretsManager: true },
        iamInstanceProfile:       'control-plane.cluster-api-provider-aws.sigs.k8s.io',
        instanceMetadataOptions:  { httpTokens: HTTP_TOKENS_VALUES.REQUIRED },
        instanceType:             't3.medium',
        marketType:               'OnDemand',
        nonRootVolumes:           [],
        publicIp:                 false,
        rootVolume:               {
          encrypted: false, size: 30, type: 'gp3'
        },
        securityGroupOverrides: {},
        sshKeyName:             'eva',
        subnet:                 { id: 'subnet-02e4caf6f4ee75111' },
        // cpuOptions:             { confidentialCompute: 'Disabled', amdSevSnp: 'disabled' } // For some reason causes an error
        // }
      }
    }
  }
};

export default {
  components: {
    Banner, Loading, InstanceConfigSection, StorageSection, AdvancedSection,
  },

  mixins: [CreateEditView],

  emits: ['validationChanged', 'update:isIpv6', 'update:isDualStack', 'update:value'],

  props: {
    uuid: {
      type:     String,
      required: true,
    },

    capiCluster: {
      type:    Object,
      default: () => ({})
    },

    credentialId: {
      type:     String,
      required: true,
    },

    disabled: {
      type:    Boolean,
      default: false
    },

    isIpv6: {
      type:    Boolean,
      default: false
    },

    isDualStack: {
      type:    Boolean,
      default: false
    },

    machinePools: {
      type:    Array,
      default: () => []
    },

    poolCreateMode: {
      type:    Boolean,
      default: true
    },
    mode: {
      type:    String,
      default: _CREATE,
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

    try {
      // TODO handle region outside of pools
      const region = this.capiCluster?.spec?.region;

      this.ec2Client = await this.$store.dispatch('aws/ec2', {
        region,
        cloudCredentialId: this.credentialId
      });
      // this.kmsClient = await this.$store.dispatch('aws/kms', {
      //   region,
      //   cloudCredentialId: this.credentialId
      // });

      if ( !this.instanceInfo ) {
        // this.instanceInfo = await this.$store.dispatch('aws/describeInstanceTypes', { client: this.ec2Client });
        this.loadInstanceInfo();
      }

      // const hash = {};

      if ( this.loadedRegionalFor !== region ) {
        this.loadAvailabilityZones();
        this.loadSubnets();
        // hash.zoneInfo = await this.ec2Client.describeAvailabilityZones({});
        // hash.vpcInfo = await this.ec2Client.describeVpcs({});
        // hash.subnetInfo = await this.ec2Client.describeSubnets({});
        // hash.securityGroupInfo = await this.ec2Client.describeSecurityGroups({});
      }

      // const res = await allHash(hash);

      // for ( const k in res ) {
      //   this[k] = res[k];
      // }

      // try {
      //   this.kmsInfo = await this.kmsClient.listKeys({});
      //   this.canReadKms = true;
      // } catch (e) {
      //   this.canReadKms = false;
      // }

      if ( !this.value.instanceType ) {
        this.value['instanceType'] = this.$store.getters['aws/defaultInstanceType'];
      }

      this.loadedRegionalFor = region;
      const valueWithDefaults = merge({}, defaultConfig, this.value);

      // TODO this is a band-aid to make sure defaults are applied before validation, but should be refactored to be cleaner and not cause an extra render
      // this.$emit('update:value', valueWithDefaults);
      const cleanedValueWithDefaults = removeEmptyFields(valueWithDefaults);

      Object.assign(this.value, cleanedValueWithDefaults || {});
    } catch (e) {
      this.errors = exceptionToErrorsArray(formatAWSError(e));
    }
  },

  data() {
    return {
      ec2Client:           null,
      kmsClient:           null,
      credential:          null,
      instanceInfo:        null,
      regionInfo:          null,
      // canReadKms:        null,
      // kmsInfo:           null,
      tags:                null,
      loadedRegionalFor:   null,
      zoneInfo:            null,
      // vpcInfo:           null,
      subnetInfo:          null,
      // securityGroupInfo: null,
      selectedNetwork:     null,
      securityGroupMode:   null,
      loadingInstanceInfo: false,
      loadingSubnets:      false,
      loadingZones:        false
    };
  },

  computed: {
    spec() {
      this.value.spec = this.value.spec || {};
      this.value.spec.template = this.value.spec.template || {};
      this.value.spec.template.spec = this.value.spec.template.spec || {};

      return this.value.spec.template.spec;
    },

    securityGroupLabels() {
      return [
        this.t('cluster.machineConfig.amazonEc2.securityGroup.mode.default', { defaultGroup: DEFAULT_GROUP }),
        this.t('cluster.machineConfig.amazonEc2.securityGroup.mode.custom')
      ];
    },

    isIamInstanceProfileNameRequired() { // TODO
      return this.capiCluster?.cloudProvider === 'aws';
    },

    instanceTypeOptions() {
      if (!this.instanceInfo || isEmpty(this.instanceInfo)) {
        return [];
      }
      let lastGroup;

      const out = [];

      for ( const row of this.instanceInfo ) {
        if ( row.groupLabel !== lastGroup ) {
          out.push({
            kind:     'group',
            disabled: true,
            label:    row.groupLabel
          });

          lastGroup = row.groupLabel;
        }

        out.push({
          label: row['label'],
          value: row['apiName'],
        });
      }

      return out;
    },

    subnetOptions() {
      return [];
    },

    DEFAULT_GROUP() {
      return DEFAULT_GROUP;
    },

    capiClusterRegion() {
      return this.capiCluster?.spec?.region || null;
    }
  },

  watch: {
    'credentialId'() {
      this.$fetch();
    },

    capiClusterRegion(newRegion, oldRegion) {
      if (newRegion === oldRegion) {
        return;
      }

      this.$fetch();
    },

    'securityGroupMode'(val) {
      this.value.securityGroupReadonly = ( val !== 'default' );
    },
  },

  created() {
    if (!this.value.instanceMetadataOptions?.httpTokens) {
      this.value.instanceMetadataOptions = {
        ...this.value.instanceMetadataOptions,
        httpTokens: HTTP_TOKENS_VALUES.REQUIRED,
      };
    }

    if (!Array.isArray(this.value.additionalVolumes)) {
      this.value.additionalVolumes = [];
    }
  },

  methods: {
    stringify,

    async loadInstanceInfo() {
      this.loadingInstanceInfo = true;
      try {
        this.instanceInfo = await this.$store.dispatch('aws/describeInstanceTypes', { client: this.ec2Client });
      } catch (e) {
        // TODO nb error loading instance info
        console.error(e);
      }
      this.loadingInstanceInfo = false;
    },

    async loadSubnets() {
      this.loadingSubnets = true;
      try {
        this.subnetInfo = await this.ec2Client.describeSubnets({});
      } catch (e) {
        // TODO nb error loading ubnet info
        console.error(e);
      }
      this.loadingSubnets = false;
    },

    async loadAvailabilityZones() {
      this.loadingZones = true;
      try {
        this.zoneInfo = await this.ec2Client.describeAvailabilityZones({});
      } catch (e) {
        // TODO nb error loading zone info
        console.error(e);
      }
      this.loadingZones = false;
    },

    initTags() {
      this.tags = convertStringToKV(this.value.tags);
    },

    updateTags(tags) {
      this.value['tags'] = convertKVToString(tags);
    },
  },
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <template v-else>
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

      <div v-if="loadedRegionalFor">
        <InstanceConfigSection
          v-model:value="spec"
          :instance-type-options="instanceTypeOptions"
          :loading-instance-type-options="loadingInstanceInfo"
          :subnet-options="subnetOptions"
          :loading-subnets="loadingSubnets"
          :mode="mode"
          :disabled="disabled"
        />
        <StorageSection
          v-model:value="spec"
          :mode="mode"
          :disabled="disabled"
        />
        <AdvancedSection
          v-model:value="spec"
          :mode="mode"
          :disabled="disabled"
        />
      </div>
    </template>
  </div>
</template>
