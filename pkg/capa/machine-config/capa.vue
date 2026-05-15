<script lang="ts">
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import CreateEditView from '@shell/mixins/create-edit-view';
import { HTTP_TOKENS_VALUES } from './constants';
import { NORMAN } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { convertStringToKV, convertKVToString } from '@shell/utils/object';
import { sortBy } from '@shell/utils/sort';
import { stringify, exceptionToErrorsArray, formatAWSError } from '@shell/utils/error';
import { _CREATE } from '@shell/config/query-params';
import InstanceConfigSection from './InstanceConfigSection.vue';
import StorageSection from './StorageSection.vue';
import AdvancedSection from './AdvancedSection.vue';

const DEFAULT_GROUP = 'rancher-nodes';

export default {
  components: {
    Banner, Loading, InstanceConfigSection, StorageSection, AdvancedSection,
  },

  mixins: [CreateEditView],

  emits: ['validationChanged', 'update:isIpv6', 'update:isDualStack'],

  props: {
    uuid: {
      type:     String,
      required: true,
    },

    cluster: {
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
      const region = this.value.region || this.credential?.decodedData.defaultRegion || this.$store.getters['aws/defaultRegion'];

      if ( !this.value.region ) {
        this.value['region'] = region;
      }
      // console.log('this.value', this.value);

      this.ec2Client = await this.$store.dispatch('aws/ec2', { region, cloudCredentialId: this.credentialId });
      this.kmsClient = await this.$store.dispatch('aws/kms', { region, cloudCredentialId: this.credentialId });

      if ( !this.instanceInfo ) {
        this.instanceInfo = await this.$store.dispatch('aws/describeInstanceTypes', { client: this.ec2Client } );
      }

      const hash = {};

      if ( !this.regionInfo ) {
        hash.regionInfo = this.ec2Client.describeRegions({});
      }

      if ( this.loadedRegionalFor !== region ) {
        hash.zoneInfo = await this.ec2Client.describeAvailabilityZones({});
        hash.vpcInfo = await this.ec2Client.describeVpcs({});
        hash.subnetInfo = await this.ec2Client.describeSubnets({});
        hash.securityGroupInfo = await this.ec2Client.describeSecurityGroups({});
      }

      const res = await allHash(hash);

      for ( const k in res ) {
        this[k] = res[k];
      }

      try {
        this.kmsInfo = await this.kmsClient.listKeys({});
        this.canReadKms = true;
      } catch (e) {
        this.canReadKms = false;
      }

      // if ( !this.value.zone ) {
      //   this.value['zone'] = 'a';
      // }

      if ( !this.value.instanceType ) {
        this.value['instanceType'] = this.$store.getters['aws/defaultInstanceType'];
      }

      // this.initTags();

      // if ( !this.value.securityGroup?.length ) {
      //   this.value['securityGroup'] = [DEFAULT_GROUP];
      // }

      // if ( this.value.securityGroup?.length === 1 && this.value.securityGroup[0] === DEFAULT_GROUP ) {
      //   this.securityGroupMode = 'default';
      // } else {
      //   this.securityGroupMode = 'custom';
      // }

      if ( !this.value.zone && this.zoneOptions.length ) {
        this.value['zone'] = this.zoneOptions[0];
      }

      this.loadedRegionalFor = region;
    } catch (e) {
      this.errors = exceptionToErrorsArray(formatAWSError(e));
    }
  },

  data() {
    return {
      ec2Client:         null,
      kmsClient:         null,
      credential:        null,
      instanceInfo:      null,
      regionInfo:        null,
      canReadKms:        null,
      kmsInfo:           null,
      tags:              null,
      loadedRegionalFor: null,
      zoneInfo:          null,
      vpcInfo:           null,
      subnetInfo:        null,
      securityGroupInfo: null,
      selectedNetwork:   null,
      securityGroupMode: null,
    };
  },

  computed: {
    securityGroupLabels() {
      return [
        this.t('cluster.machineConfig.amazonEc2.securityGroup.mode.default', { defaultGroup: DEFAULT_GROUP }),
        this.t('cluster.machineConfig.amazonEc2.securityGroup.mode.custom')
      ];
    },

    isIamInstanceProfileNameRequired() {
      return this.cluster?.cloudProvider === 'aws';
    },

    instanceTypeOptions() {
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

    regionOptions() {
      if ( !this.regionInfo ) {
        return [];
      }

      return this.regionInfo.Regions.map((obj) => {
        return obj.RegionName;
      }).sort();
    },

    zoneOptions() {
      if ( !this.zoneInfo ) {
        return [];
      }

      return this.zoneInfo.AvailabilityZones.map((obj) => {
        return obj.ZoneName.substr(-1);
      }).sort();
    },

    securityGroupOptions() {
      if ( !this.securityGroupInfo ) {
        return [];
      }

      const out = this.securityGroupInfo.SecurityGroups.filter((obj) => {
        return obj.VpcId === this.value.vpcId;
      }).map((obj) => {
        return {
          label:       obj.GroupName,
          description: obj.GroupDescription,
          value:       obj.GroupName
        };
      });

      return sortBy(out, 'label');
    },

    kmsOptions() {
      if ( !this.kmsInfo ) {
        return [];
      }

      const out = this.kmsInfo.Keys.map((obj) => {
        return obj.KeyArn;
      }).sort();

      return out;
    },

    DEFAULT_GROUP() {
      return DEFAULT_GROUP;
    }
  },

  watch: {
    'credentialId'() {
      this.$fetch();
    },

    'value.region'() {
      this.$fetch();
    },

    'value.zone'() {
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

    initTags() {
      this.tags = convertStringToKV(this.value.tags);
    },

    updateTags(tags) {
      this.value['tags'] = convertKVToString(tags);
    },

    test() {
      const errors = [];

      if (!this.value.subnetId && !this.value.vpcId) {
        errors.push(this.t('validation.required', { key: 'VPC/Subnet' }, true));
      }

      return { errors };
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
          :value="value"
          :instance-type-options="instanceTypeOptions"
          :subnet-options="subnetOptions"
          :mode="mode"
          :disabled="disabled"
        />
        <StorageSection
          :value="value"
          :mode="mode"
          :disabled="disabled"
        />
        <AdvancedSection
          v-model:value="value"
          :mode="mode"
          :disabled="disabled"
        />
      </div>
    </template>
  </div>
</template>
