<script>
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import LabeledSelect from '@/components/form/LabeledSelect';
import LabeledInput from '@/components/form/LabeledInput';
import UnitInput from '@/components/form/UnitInput';
import RadioGroup from '@/components/form/RadioGroup';
import Checkbox from '@/components/form/Checkbox';
import { SECRET } from '@/config/types';
import { allHash } from '@/utils/promise';
import { addObject, addObjects, findBy } from '@/utils/array';
import { sortBy } from '@/utils/sort';

const DEFAULT_GROUP = 'rancher-nodes';

export default {
  components: {
    Loading, LabeledInput, LabeledSelect, Checkbox, RadioGroup, UnitInput
  },

  mixins: [CreateEditView],

  props: {
    credentialId: {
      type:     String,
      required: true,
    },
  },

  async fetch() {
    if ( !this.credentialId ) {
      return;
    }

    if ( this.credential?.id !== this.credentialId ) {
      this.credential = await this.$store.dispatch('management/find', { type: SECRET, id: this.credentialId });
    }

    if ( !this.instanceInfo ) {
      this.instanceInfo = await this.$store.dispatch('aws/instanceInfo');
    }

    const region = this.value.region || this.credential?.decodedData.defaultRegion || this.$store.getters['aws/defaultRegion'];
    const cloudCredentialId = this.credential.id;

    if ( !this.value.region ) {
      this.$set(this.value, 'region', region);
    }

    this.ec2Client = await this.$store.dispatch('aws/ec2', { region, cloudCredentialId });
    this.kmsClient = await this.$store.dispatch('aws/kms', { region, cloudCredentialId });

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

    if ( !this.value.securityGroup?.length ) {
      this.$set(this.value, 'securityGroup', [DEFAULT_GROUP]);
    }

    if ( this.value.securityGroup?.length === 1 && this.value.securityGroup[0] === DEFAULT_GROUP ) {
      this.securityGroupMode = 'default';
    } else {
      this.securityGroupMode = 'custom';
    }

    this.loadedRegionalFor = region;
  },

  data() {
    return {
      ec2Client:    null,
      kmsClient:    null,
      credential:   null,
      instanceInfo: null,
      regionInfo:   null,
      canReadKms:   null,
      kmsInfo:      null,

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
    instanceOptions() {
      return this.instanceInfo.map((obj) => {
        return {
          label: `${ obj['API Name'] } (${ obj['vCPUs'] } / ${ obj['Memory'] })`,
          value: obj['API Name'],
        };
      });
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
        vpcs.push({
          label:     `${ obj.VpcId } (${ obj.CidrBlock })`,
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

        entry.push({
          label:     `${ obj.SubnetId } (${ obj.CidrBlock } - ${ obj.AvailableIpAddressCount } available)`,
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
          value:       obj.GroupId
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
      this.value.securityGroupReadonly = ( val === 'default' );
    },
  },

  methods: {
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
    }
  },
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <div v-if="loadedRegionalFor" class="mt-20">
      <h2>Basics</h2>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledSelect
            v-model="value.region"
            :options="regionOptions"
            :searchable="true"
            label="Region"
          />
        </div>
        <div class="col span-6">
          <LabeledSelect
            v-model="value.zone"
            :options="zoneOptions"
            label="Zone"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-12">
          <LabeledSelect
            v-model="value.instanceType"
            :options="instanceOptions"
            :searchable="true"
            label="Instance Type"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-12">
          <LabeledInput
            v-model="value.iamInstanceProfile"
            label="IAM Instance Profile Name"
            tooltip="Kubernetes AWS Cloud Provider support requires an appropriate instance profile"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model="value.ami"
            label="AMI ID"
            placeholder="Default: A recent Ubuntu LTS"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.sshUser"
            label="Username"
            :disabled="!value.ami"
            placeholder="Default: ubuntu"
            tooltip="The username that exists in the selected AMI; Provisioning will SSH to the node with this."
          />
        </div>
      </div>
      <div class="row mt-20">
        <div class="col span-12">
          <LabeledSelect
            :value="selectedNetwork"
            :options="networkOptions"
            :searchable="true"
            label="VPC/Subnet"
            @input="updateNetwork($event)"
          >
            <template v-slot:option="opt">
              <template v-if="opt.kind === 'vpc'">
                <b>{{ opt.label }}</b>
              </template>
              <template v-else>
                <span class="pl-10">{{ opt.label }}</span>
              </template>
            </template>
          </LabeledSelect>
        </div>
      </div>
      <div class="row mt-20">
        <div class="col span-12">
          <RadioGroup
            v-model="securityGroupMode"
            name="securityGroupMode"
            label="Security Group"
            :mode="mode"
            :disabled="!value.vpcId"
            :labels="[`Standard: Automatically create and use a '${DEFAULT_GROUP}' security group`, 'Choose one or more existing security groups']"
            :options="['default','custom']"
          />
          <LabeledSelect
            v-if="value.vpcId && securityGroupMode === 'custom'"
            v-model="value.securityGroup"
            :disabled="!value.vpcId"
            :options="securityGroupOptions"
            :searchable="true"
            :multiple="true"
            :taggable="true"
            label="Security Groups"
          />
        </div>
      </div>

      <h2 class="mt-20">
        Storage
      </h2>
      <div class="row">
        <div class="col span-6">
          <UnitInput v-model="value.rootSize" placeholder="Default: 16" label="Root Disk Size" suffix="GB" />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.volumeType"
            label="Volume Type"
            placeholder="Default: gp2"
          />
        </div>
      </div>

      <div class="row mt-20">
        <div class="col span-12">
          <Checkbox v-model="value.encryptEbsVolume" label="Encrypt EBS Volume" />
        </div>
      </div>
      <div v-if="value.encryptEbsVolume" class="row mt-10">
        <div class="col span-12">
          <LabeledSelect
            v-if="canReadKms"
            v-model="value.kmsKey"
            :options="kmsOptions"
            label="KMS Key ARN"
          />
          <template v-else>
            <LabeledInput
              v-model="value.kmsKey"
              label="KMS Key ARN"
            />
            <p class="text-muted">
              You do not have permission to list KMS keys, but may still be able to enter a Key ARN if you know one.
            </p>
          </template>
        </div>
      </div>

      <div class="row mt-20">
        <div class="col span-12">
          <Checkbox v-model="value.requestSpotInstance" label="Request Spot Instance" />
        </div>
      </div>
      <div v-if="value.requestSpotInstance" class="row mt-10">
        <div class="col span-6">
          <UnitInput v-model="value.spotPrice" placeholder="Default: 0.50" label="Spot Price" suffix="Dollars per hour" />
        </div>
      </div>

      <div class="row mt-20">
        <div class="col span-6">
          <div><Checkbox v-model="value.privateAddressOnly" label="Use only private addresses" /></div>
          <div><Checkbox v-model="value.useEbsOptimizedInstance" label="EBS-Optimized Instance" /></div>
        </div>
        <div class="col span-6">
          <div><Checkbox v-model="value.httpEndpoint" label="Allow access to EC2 metadata" /></div>
          <div><Checkbox v-model="value.httpTokens" :disabled="!value.httpEndpoint" label="Use tokens for metadata" /></div>
        </div>
      </div>

      <div class="row mt-20">
        <div class="col span-12">
          (Tags)
        </div>
      </div>
    </div>
  </div>
</template>
