<script>
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import CreateEditView from '@shell/mixins/create-edit-view';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import KeyValue from '@shell/components/form/KeyValue';
import UnitInput from '@shell/components/form/UnitInput';
import { RadioGroup } from '@components/Form/Radio';
import { Checkbox } from '@components/Form/Checkbox';
import { NORMAN } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { addObject, addObjects, findBy } from '@shell/utils/array';
import { sortBy } from '@shell/utils/sort';
import { stringify, exceptionToErrorsArray } from '@shell/utils/error';

const DEFAULT_GROUP = 'rancher-nodes';

export default {
  components: {
    Banner, Loading, LabeledInput, LabeledSelect, Checkbox, RadioGroup, UnitInput, KeyValue
  },

  mixins: [CreateEditView],

  props: {
    uuid: {
      type:     String,
      required: true,
    },

    cluster: {
      type:     Object,
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
      const region = this.value.region || this.credential?.decodedData.defaultRegion || this.$store.getters['aws/defaultRegion'];

      if ( !this.value.region ) {
        this.$set(this.value, 'region', region);
      }

      this.ec2Client = await this.$store.dispatch('aws/ec2', { region, cloudCredentialId: this.credentialId });
      this.kmsClient = await this.$store.dispatch('aws/kms', { region, cloudCredentialId: this.credentialId });

      if ( !this.instanceInfo ) {
        this.instanceInfo = await this.$store.dispatch('aws/instanceInfo', { client: this.ec2Client } );
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

      if ( !this.value.zone ) {
        this.$set(this.value, 'zone', 'a');
      }

      if ( !this.value.instanceType ) {
        this.$set(this.value, 'instanceType', this.$store.getters['aws/defaultInstanceType']);
      }

      this.initNetwork();
      this.initTags();

      if ( !this.value.securityGroup?.length ) {
        this.$set(this.value, 'securityGroup', [DEFAULT_GROUP]);
      }

      if ( this.value.securityGroup?.length === 1 && this.value.securityGroup[0] === DEFAULT_GROUP ) {
        this.securityGroupMode = 'default';
      } else {
        this.securityGroupMode = 'custom';
      }

      this.loadedRegionalFor = region;
    } catch (e) {
      this.errors = exceptionToErrorsArray(e);
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

    instanceOptions() {
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

    networkOptions() {
      if ( !this.vpcInfo || !this.subnetInfo ) {
        return [];
      }

      let vpcs = [];
      const subnetsByVpc = {};

      for ( const obj of this.vpcInfo.Vpcs ) {
        const name = obj.Tags && obj.Tags?.length ? obj.Tags.find(t => t.Key === 'Name')?.Value : null;

        vpcs.push({
          label:     name || obj.VpcId,
          subLabel:  name ? obj.VpcId : obj.CidrBlock,
          isDefault: obj.IsDefault || false,
          kind:      'vpc',
          value:     obj.VpcId,
        });
      }

      vpcs = sortBy(vpcs, ['isDefault:desc', 'label']);

      for ( const obj of this.subnetInfo.Subnets ) {
        if ( obj.AvailabilityZone !== `${ this.value.region }${ this.value.zone }` ) {
          continue;
        }

        let entry = subnetsByVpc[obj.VpcId];

        if ( !entry ) {
          entry = [];
          subnetsByVpc[obj.VpcId] = entry;
        }

        const name = obj.Tags && obj.Tags?.length ? obj.Tags.find(t => t.Key === 'Name')?.Value : null;

        entry.push({
          label:     name || obj.SubnetId,
          subLabel:  name ? obj.SubnetId : obj.CidrBlock,
          kind:      'subnet',
          isDefault: obj.DefaultForAz || false,
          value:     obj.SubnetId,
          vpcId:     obj.VpcId,
        });
      }

      const out = [];

      for ( const obj of vpcs ) {
        addObject(out, obj);

        if ( subnetsByVpc[obj.value] ) {
          addObjects(out, sortBy(subnetsByVpc[obj.value], ['isDefault:desc', 'label']));
        }
      }

      return out;
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

  methods: {
    stringify,

    initNetwork() {
      const id = this.value.subnetId || this.value.vpcId;

      this.selectedNetwork = id;
    },

    updateNetwork(value) {
      let obj;

      if ( value ) {
        obj = findBy(this.networkOptions, 'value', value);
      }

      if ( obj?.kind === 'subnet' ) {
        this.value.subnetId = value;
        this.value.vpcId = obj.vpcId;
        this.selectedNetwork = value;
      } else if ( obj ) {
        this.value.subnetId = null;
        this.value.vpcId = value;
        this.selectedNetwork = value;
      } else {
        this.value.subnetId = null;
        this.value.vpcId = null;
        this.selectedNetwork = null;
      }
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

      this.$set(this.value, 'tags', ary.join(','));
    },

    test() {
      const errors = [];

      if (!this.selectedNetwork) {
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
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledSelect
              v-model="value.region"
              :mode="mode"
              :options="regionOptions"
              :required="true"
              :searchable="true"
              :disabled="disabled"
              :label="t('cluster.machineConfig.amazonEc2.region')"
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-model="value.zone"
              :mode="mode"
              :options="zoneOptions"
              :required="true"
              :disabled="disabled"
              :label="t('cluster.machineConfig.amazonEc2.zone')"
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-9">
            <LabeledSelect
              v-model="value.instanceType"
              :mode="mode"
              :options="instanceOptions"
              :required="true"
              :selectable="option => !option.disabled"
              :searchable="true"
              :disabled="disabled"
              :label="t('cluster.machineConfig.amazonEc2.instanceType')"
            >
              <template v-slot:option="opt">
                <template v-if="opt.kind === 'group'">
                  <b>{{ opt.label }}</b>
                </template>
                <template v-else>
                  <span class="pl-10">{{ opt.label }}</span>
                </template>
              </template>
            </LabeledSelect>
          </div>
          <div class="col span-3">
            <UnitInput
              v-model="value.rootSize"
              output-as="string"
              :mode="mode"
              :disabled="disabled"
              :placeholder="t('cluster.machineConfig.amazonEc2.rootSize.placeholder')"
              :label="t('cluster.machineConfig.amazonEc2.rootSize.label')"
              :suffix="t('cluster.machineConfig.amazonEc2.rootSize.suffix')"
            />
          </div>
        </div>
        <div class="row mt-20 mb-20">
          <div class="col span-6">
            <LabeledSelect
              :mode="mode"
              :value="selectedNetwork"
              :options="networkOptions"
              :searchable="true"
              :required="true"
              :disabled="disabled"
              :placeholder="t('cluster.machineConfig.amazonEc2.selectedNetwork.placeholder')"
              :label="t('cluster.machineConfig.amazonEc2.selectedNetwork.label')"
              option-key="value"
              @input="updateNetwork($event)"
            >
              <template v-slot:option="opt">
                <div :class="{'vpc': opt.kind === 'vpc', 'vpc-subnet': opt.kind !== 'vpc'}">
                  <span class="vpc-name">{{ opt.label }}</span><span class="vpc-info">{{ opt.subLabel }}</span>
                </div>
              </template>
            </LabeledSelect>
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="value.iamInstanceProfile"
              :mode="mode"
              :disabled="disabled"
              :required="isIamInstanceProfileNameRequired"
              :tooltip="t('cluster.machineConfig.amazonEc2.iamInstanceProfile.tooltip')"
              :label="t('cluster.machineConfig.amazonEc2.iamInstanceProfile.label')"
            />
          </div>
        </div>

        <portal :to="'advanced-'+uuid">
          <div class="row mt-20">
            <div class="col span-6">
              <LabeledInput
                v-model="value.ami"
                :mode="mode"
                :disabled="disabled"
                :placeholder="t('cluster.machineConfig.amazonEc2.ami.placeholder')"
                :label="t('cluster.machineConfig.amazonEc2.ami.label')"
              />
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model="value.sshUser"
                :mode="mode"
                :label="t('cluster.machineConfig.amazonEc2.sshUser.label')"
                :disabled="!value.ami || disabled"
                :tooltip="t('cluster.machineConfig.amazonEc2.sshUser.tooltip')"
                :placeholder="t('cluster.machineConfig.amazonEc2.sshUser.placeholder')"
              />
            </div>
          </div>

          <div class="row mt-20">
            <div class="col span-12">
              <h3>
                {{ t('cluster.machineConfig.amazonEc2.securityGroup.title') }}
                <span v-if="!value.vpcId" class="text-muted text-small">
                  {{ t('cluster.machineConfig.amazonEc2.securityGroup.vpcId') }}
                </span>
              </h3>
              <RadioGroup
                v-model="securityGroupMode"
                name="securityGroupMode"
                :mode="mode"
                :disabled="!value.vpcId || disabled"
                :labels="securityGroupLabels"
                :options="['default','custom']"
              />
              <LabeledSelect
                v-if="value.vpcId && securityGroupMode === 'custom'"
                v-model="value.securityGroup"
                :mode="mode"
                :disabled="!value.vpcId || disabled"
                :options="securityGroupOptions"
                :searchable="true"
                :multiple="true"
                :taggable="true"
              />
            </div>
          </div>

          <div class="row mt-20">
            <div class="col span-6">
              <LabeledInput
                v-model="value.volumeType"
                :mode="mode"
                :disabled="disabled"
                :label="t('cluster.machineConfig.amazonEc2.volumeType.label')"
                :placeholder="t('cluster.machineConfig.amazonEc2.volumeType.placeholder')"
              />
            </div>
          </div>

          <div class="row mt-20">
            <div class="col span-12">
              <Checkbox
                v-model="value.encryptEbsVolume"
                :mode="mode"
                :label="t('cluster.machineConfig.amazonEc2.encryptEbsVolume')"
              />
              <div v-if="value.encryptEbsVolume" class="mt-10">
                <LabeledSelect
                  v-if="canReadKms"
                  v-model="value.kmsKey"
                  :mode="mode"
                  :options="kmsOptions"
                  :disabled="disabled"
                  :label="t('cluster.machineConfig.amazonEc2.kmsKey.label')"
                />
                <template v-else>
                  <LabeledInput
                    v-model="value.kmsKey"
                    :mode="mode"
                    :disabled="disabled"
                    :label="t('cluster.machineConfig.amazonEc2.kmsKey.label')"
                  />
                  <p class="text-muted">
                    {{ t('cluster.machineConfig.amazonEc2.kmsKey.text') }}
                  </p>
                </template>
              </div>
            </div>
          </div>
          <div class="row mt-20">
            <div class="col span-6">
              <Checkbox
                v-model="value.requestSpotInstance"
                :mode="mode"
                :label="t('cluster.machineConfig.amazonEc2.requestSpotInstance')"
              />
              <div v-if="value.requestSpotInstance" class="mt-10">
                <UnitInput
                  v-model="value.spotPrice"
                  output-as="string"
                  :mode="mode"
                  :disabled="disabled"
                  :placeholder="t('cluster.machineConfig.amazonEc2.spotPrice.placeholder')"
                  :label="t('cluster.machineConfig.amazonEc2.spotPrice.label')"
                  :suffix="t('cluster.machineConfig.amazonEc2.spotPrice.suffix')"
                />
              </div>
            </div>
          </div>

          <div class="row mt-20">
            <div class="col span-12">
              <div>
                <Checkbox
                  v-model="value.privateAddressOnly"
                  :mode="mode"
                  :disabled="disabled"
                  :label="t('cluster.machineConfig.amazonEc2.privateAddressOnly')"
                />
              </div>
              <div>
                <Checkbox
                  v-model="value.useEbsOptimizedInstance"
                  :mode="mode"
                  :disabled="disabled"
                  :label="t('cluster.machineConfig.amazonEc2.useEbsOptimizedInstance')"
                />
              </div>
              <div>
                <Checkbox
                  v-model="value.httpEndpoint"
                  value-when-true="enabled"
                  :mode="mode"
                  :disabled="disabled"
                  :label="t('cluster.machineConfig.amazonEc2.httpEndpoint')"
                />
              </div>
              <div>
                <Checkbox
                  v-model="value.httpTokens"
                  value-when-true="required"
                  :mode="mode"
                  :disabled="!value.httpEndpoint || disabled"
                  :label="t('cluster.machineConfig.amazonEc2.httpTokens')"
                />
              </div>
            </div>
          </div>

          <div class="row mt-20">
            <div class="col span-12">
              <KeyValue
                :value="tags"
                :mode="mode"
                :read-allowed="false"
                :label="t('cluster.machineConfig.amazonEc2.tagTitle')"
                :add-label="t('labels.addTag')"
                :disabled="disabled"
                @input="updateTags"
              />
            </div>
          </div>
        </portal>
      </div>
    </template>
  </div>
</template>
<style scoped lang="scss">
  .vpc, .vpc-subnet {
    display: flex;
    line-height: 30px;

    .vpc-name {
      font-weight: bold;
      flex: 1;
    }

    .vpc-info {
      font-size: 12px;
      opacity: 0.7;
    }
  }

  .vpc-subnet .vpc-name {
    font-weight: normal;
    padding-left: 15px;
  }
</style>
