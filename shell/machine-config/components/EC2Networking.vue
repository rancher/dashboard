<script>

import { Checkbox } from '@components/Form/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { sortBy } from '@shell/utils/sort';
import { addObject, addObjects, findBy } from '@shell/utils/array';
import { isEmpty } from '@shell/utils/object';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';

import { _CREATE } from '@shell/config/query-params';

export default {
  name: 'Ec2MachinePoolNetworking',

  components: {
    Checkbox, LabeledSelect, LabeledInput, Banner
  },

  emits: ['update:enablePrimaryIpv6', 'update:ipv6AddressCount', 'update:ipv6AddressOnly', 'update:httpProtocolIpv6', 'update:vpcId', 'update:subnetId', 'update:hasIpv6', 'validationChanged'],

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    region: {
      type:    String,
      default: ''
    },

    zone: {
      type:    String,
      default: ''
    },

    vpcInfo: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    subnetInfo: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    enablePrimaryIpv6: {
      type:    Boolean,
      default: false
    },

    ipv6AddressCount: {
      type:    Number,
      default: 0
    },

    ipv6AddressOnly: {
      type:    Boolean,
      default: false
    },

    httpProtocolIpv6: {
      type:    Boolean,
      default: false
    },

    vpcId: {
      type:    String,
      default: ''
    },

    subnetId: {
      type:    String,
      default: ''
    },

    hasIpv6: {
      type:    Boolean,
      default: false
    },

    machinePools: {
      type:    Array,
      default: () => []
    }
  },

  created() {
    const subnets = this.subnetInfo?.Subnets || [];

    this.selectedNetwork = this.subnetId || this.vpcId;
    if (this.subnetId) {
      const subnetObj = subnets.find((sn) => sn.SubnetId === this.subnetId);

      this.enableIpv6 = subnetObj?.Ipv6CidrBlockAssociationSet && !isEmpty(subnetObj?.Ipv6CidrBlockAssociationSet);
    } else if (this.vpcId) {
      this.enableIpv6 = subnets.find((sn) => sn.VpcId === this.vpcId && sn.Ipv6CidrBlockAssociationSet && !isEmpty(sn.Ipv6CidrBlockAssociationSet));
    }
  },

  data() {
    return { selectedNetwork: {}, enableIpv6: false };
  },

  watch: {
    region() {
      this.updateNetwork();
    },

    enableIpv6(neu) {
      const opts = neu ? this.ipv6NetworkOptions : this.ipv4OnlyNetworkOptions;

      if (!opts.find((opt) => opt.value === this.selectedNetwork)) {
        this.updateNetwork();
      }

      if (neu) {
        this.$emit('update:ipv6AddressCount', 1);
      } else {
        this.$emit('update:ipv6AddressCount', 0);
        this.$emit('update:ipv6AddressOnly', false);
        this.$emit('update:enablePrimaryIpv6', false);
      }
    },

    ipv6Selected(neu) {
      if (neu) {
        this.$emit('update:hasIpv6', true);

        this.$emit('update:ipv6AddressOnly', neu);
      } else if (!this.dualStackSelected) {
        this.$emit('update:hasIpv6', false);

        this.$emit('update:ipv6AddressOnly', false);
      }
    },

    dualStackSelected(neu) {
      if (neu) {
        this.$emit('update:hasIpv6', true);
      } else if (!this.ipv6Selected) {
        this.$emit('update:hasIpv6', false);
      }
    },

    poolsInvalid(neu) {
      this.$emit('validationChanged', !neu);
    }
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },

    allNetworkOptions() {
      if ( !this.vpcInfo || !this.subnetInfo ) {
        return [];
      }
      let vpcs = [];
      const subnetsByVpc = {};

      for ( const obj of this.vpcInfo.Vpcs ) {
        const name = obj.Tags && obj.Tags?.length ? obj.Tags.find((t) => t.Key === 'Name')?.Value : null;

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
        if ( obj.AvailabilityZone !== `${ this.region }${ this.zone }` ) {
          continue;
        }

        let entry = subnetsByVpc[obj.VpcId];

        if ( !entry ) {
          entry = [];
          subnetsByVpc[obj.VpcId] = entry;
        }

        const name = obj.Tags && obj.Tags?.length ? obj.Tags.find((t) => t.Key === 'Name')?.Value : null;

        entry.push({
          label:     name || obj.SubnetId,
          subLabel:  name ? obj.SubnetId : obj.CidrBlock,
          kind:      'subnet',
          isDefault: obj.DefaultForAz || false,
          value:     obj.SubnetId,
          vpcId:     obj.VpcId,
          hasIpv6:   obj.Ipv6CidrBlockAssociationSet && !isEmpty(obj.Ipv6CidrBlockAssociationSet),
          hasIpv4:   !!obj.CidrBlock
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

    // ipv4-only subnets and vpcs with at least one ipv4-only subnet
    ipv4OnlyNetworkOptions() {
      const ipv4SubnetsOnly = this.allNetworkOptions.filter((opt) => {
        const isSubnet = opt.kind === 'subnet';

        return isSubnet && opt.hasIpv4 && !opt.hasIpv6;
      });

      return this.allNetworkOptions.filter((opt) => {
        if (opt.kind === 'vpc') {
          return ipv4SubnetsOnly.find((subnetOpt) => subnetOpt.vpcId === opt.value);
        }

        return opt.hasIpv4 && !opt.hasIpv6;
      });
    },

    // ipv6-enabled subnets and vpcs that have at least one ipv6 subnet
    ipv6NetworkOptions() {
      const ipv6SubnetsOnly = this.allNetworkOptions.filter((opt) => {
        const isSubnet = opt.kind === 'subnet';

        return isSubnet && opt.hasIpv6;
      });

      return this.allNetworkOptions.filter((opt) => {
        if (opt.kind === 'vpc') {
          return ipv6SubnetsOnly.find((subnetOpt) => subnetOpt.vpcId === opt.value);
        }

        return opt.hasIpv6;
      });
    },

    networkOptions() {
      return this.enableIpv6 ? this.ipv6NetworkOptions : this.ipv4OnlyNetworkOptions;
    },

    // ipv4 and ipv6 subnet selected, or vpc with at least one subnet that has both ipv4 and ipv6
    dualStackSelected() {
      const opt = this.allNetworkOptions.find((o) => o.value === this.selectedNetwork);

      if (opt?.kind === 'vpc') {
        const subnetOpts = this.allNetworkOptions.filter((o) => {
          return o.vpcId === this.selectedNetwork;
        });

        const hasIpv4 = subnetOpts.find((o) => o.hasIpv4);
        const hasIpv6 = subnetOpts.find((o) => o.hasIpv6);

        return hasIpv4 && hasIpv6;
      } else {
        return opt?.hasIpv4 && opt?.hasIpv6;
      }
    },

    // ipv6-only subnet selected
    ipv6Selected() {
      const opt = this.allNetworkOptions.find((o) => o.value === this.selectedNetwork);

      return opt && opt.hasIpv6 && !opt.hasIpv4;
    },

    poolsInvalid() {
      const hasIpv6 = !!this.machinePools.find((p) => {
        return !!p?.config?.ipv6AddressCount && (p?.config?.subnetId || p?.config?.vpcId);
      });

      const hasNotIpv6 = !!this.machinePools.find((p) => !p?.config?.ipv6AddressCount && (p?.config?.subnetId || p?.config?.vpcId));

      return hasIpv6 && hasNotIpv6;
    },
  },

  methods: {
    updateNetwork(value) {
      let obj;

      if ( value ) {
        obj = findBy(this.allNetworkOptions, 'value', value);
      }

      if ( obj?.kind === 'subnet' ) {
        this.$emit('update:subnetId', value);
        this.$emit('update:vpcId', obj.vpcId);
        this.selectedNetwork = value;
      } else if ( obj ) {
        this.$emit('update:subnetId', null);
        this.$emit('update:vpcId', value);
        this.selectedNetwork = value;
      } else {
        this.$emit('update:subnetId', null);
        this.$emit('update:vpcId', null);
        this.selectedNetwork = null;
      }
    },
  }
};
</script>

<template>
  <Banner
    v-if="poolsInvalid"
    color="error"
    :label="t('cluster.machineConfig.amazonEc2.ipv6ValidationWarning')"
  />
  <div class="row mb-20">
    <div class="col span-6">
      <Checkbox
        v-if="isCreate || enableIpv6"
        v-model:value="enableIpv6"
        :disabled="!isCreate"
        :label="t('cluster.machineConfig.amazonEc2.enableIpv6.label')"
        data-testid="amazonEc2__enableIpv6"
        :mode="mode"
      />
    </div>
  </div>
  <div class="row mb-20 ipv6-row">
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
        data-testid="amazonEc2__selectedNetwork"
        option-key="value"
        @update:value="updateNetwork($event)"
      >
        <template v-slot:option="opt">
          <div :class="{'vpc': opt.kind === 'vpc', 'vpc-subnet': opt.kind !== 'vpc'}">
            <span class="vpc-name">{{ opt.label }}</span><span class="vpc-info">{{ opt.subLabel }}</span>
          </div>
        </template>
      </LabeledSelect>
    </div>
    <div
      v-if="enableIpv6"
      class="col span-3"
    >
      <Checkbox
        :disabled="!isCreate || !dualStackSelected"
        :value="ipv6AddressOnly"
        :label="t('cluster.machineConfig.amazonEc2.ipv6AddressOnly.label')"
        :mode="mode"
        data-testid="amazonEc2__ipv6AddressOnly"
        @update:value="e=>$emit('update:ipv6AddressOnly', e)"
      />
    </div>
  </div>
  <div
    v-if="enableIpv6"
    class="row mb-10 ipv6-row"
  >
    <div class="col span-6">
      <Checkbox
        :value="httpProtocolIpv6"
        :disabled="!isCreate"
        :label="t('cluster.machineConfig.amazonEc2.httpProtocolIpv6.label')"
        data-testid="amazonEc2__enableIpv6"
        :mode="mode"
        @update:value="e=>$emit('update:httpProtocolIpv6', e)"
      />
    </div>
  </div>
  <div
    v-if="enableIpv6"
    class="row mb-10 ipv6-row"
  >
    <div class="col span-3">
      <LabeledInput
        :disabled="!isCreate"
        type="number"
        min="1"
        :mode="mode"
        :value="ipv6AddressCount"
        label-key="cluster.machineConfig.amazonEc2.ipv6AddressCount.label"
        data-testid="amazonEc2__ipv6AddressCount"
        @update:value="e=>$emit('update:ipv6AddressCount', e)"
      />
    </div>
    <div class="col span-9">
      <Checkbox
        :disabled="!isCreate"
        :value="enablePrimaryIpv6"
        :label="t('cluster.machineConfig.amazonEc2.enablePrimaryIpv6.label')"
        :mode="mode"
        data-testid="amazonEc2__enablePrimaryIpv6"
        @update:value="e=>$emit('update:enablePrimaryIpv6', e)"
      />
      <div class="text-muted">
        <t

          k="cluster.machineConfig.amazonEc2.enablePrimaryIpv6.description"
        />
      </div>
    </div>
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

  .ipv6-row {
    display: flex;
    align-items: center;
  }
</style>
