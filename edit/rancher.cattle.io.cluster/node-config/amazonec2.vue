<script>
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import LabeledSelect from '@/components/form/LabeledSelect';
import LabeledInput from '@/components/form/LabeledInput';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import { SECRET } from '@/config/types';
import { allHash } from '@/utils/promise';
import { addObject, addObjects } from '@/utils/array';
import { sortBy } from '@/utils/sort';

export default {
  components: {
    Loading, Tabbed, Tab, LabeledInput, LabeledSelect,
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

    if ( !this.value.region ) {
      this.$set(this.value, 'region', region);
    }

    this.client = await this.$store.dispatch('aws/ec2', {
      region,
      cloudCredentialId: this.credential.id
    });

    const hash = {};

    if ( !this.regionInfo ) {
      hash.regionInfo = this.client.describeRegions({});
    }

    if ( this.loadedRegionalFor !== region ) {
      hash.zoneInfo = await this.client.describeAvailabilityZones({});
      hash.vpcInfo = await this.client.describeVpcs({});
      hash.subnetInfo = await this.client.describeSubnets({});
      hash.securityGroupInfo = await this.client.describeSecurityGroups({});
    }

    const res = await allHash(hash);

    for ( const k in res ) {
      this[k] = res[k];
    }

    if ( !this.value.zone ) {
      this.$set(this.value, 'zone', 'a');
    }

    if ( !this.value.instanceType ) {
      this.$set(this.value, 'instanceType', this.$store.getters['aws/defaultInstanceType']);
    }

    this.loadedRegionalFor = region;
  },

  data() {
    return {
      client:       null,
      credential:   null,
      instanceInfo: null,
      regionInfo:   null,

      loadedRegionalFor: null,
      zoneInfo:          null,
      vpcInfo:           null,
      subnetInfo:        null,
      securityGroupInfo: null,
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
          value:     obj.vpcId,
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
  },
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <Tabbed v-if="loadedRegionalFor" ref="tabbed" :side-tabs="true" default-tab="basics" class="mt-20">
      <Tab name="basics" label="Basics" :weight="10">
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
      </Tab>
      <Tab name="networking" label="Networking" :weight="8">
        <div class="row mb-20">
          <div class="col span-6">
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

        <ul>
          <li>vpcId</li>
          <li>subnetId</li>
          <li>securityGroup</li>
          <li>securityGroupReadonly</li>
          <li>privateAddressOnly</li>
          <li>httpEndpoint - Enable metadata endpoint </li>
          <li>httpTokens - Use tokens for metadata</li>
        </ul>
      </Tab>
      <Tab name="storage" label="Storage" :weight="7">
        <ul>
          <li>rootSize</li>
          <li>encryptEbsVolume</li>
          <li>kmsKey</li>
          <li>useEbsOptimizedInstance</li>
          <li>volumeType</li>
        </ul>
      </Tab>
      <Tab name="advanced" label="Advanced" :weight="6">
        <ul>
          <li>requestSpotInstance</li>
          <li>spotPrice</li>
          <li>blockDurationMinutes - Spot instance duration </li>

          <li>monitoring - Cloudwatch monitoring</li>
          <li>tags</li>
        </ul>
      </Tab>
      <Tab name="hidden" label="(Not Exposed)" :weight="5">
        <ul>
          <li>deviceName - Root device name</li>
          <li>endpoint</li>
          <li>insecureTransport</li>
          <li>openPort</li>
          <li>retries</li>
          <li>sessionToken</li>
          <li>keypairName</li>
          <li>sshKeyContents</li>
          <li>usePrivateAddress</li>
          <li>userdata</li>
        </ul>
      </Tab>
    </Tabbed>
  </div>
</template>
