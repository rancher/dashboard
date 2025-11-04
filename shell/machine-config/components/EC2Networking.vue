<script>

import { Checkbox } from '@components/Form/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { sortBy } from '@shell/utils/sort';
import { addObject, addObjects, findBy } from '@shell/utils/array';
import { isEmpty } from '@shell/utils/object';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';
import { scrollToBottom } from '@shell/utils/scroll';
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

    disabled: {
      type:    Boolean,
      default: true
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
      type:    String,
      default: '0'
    },

    ipv6AddressOnly: {
      type:    Boolean,
      default: false
    },

    httpProtocolIpv6: {
      type:    String,
      default: 'disabled'
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
    },

    isNew: {
      type:    Boolean,
      default: true
    },
  },

  created() {
    const subnets = this.subnetInfo?.Subnets || [];
    const vpcs = this.vpcInfo?.Vpcs || [];

    this.selectedNetwork = this.subnetId || this.vpcId;
    if (this.subnetId) {
      const subnetObj = subnets.find((sn) => sn.SubnetId === this.subnetId);

      this.enableIpv6 = !!subnetObj?.Ipv6CidrBlockAssociationSet && !isEmpty(subnetObj?.Ipv6CidrBlockAssociationSet);
    } else if (this.vpcId) {
      this.enableIpv6 = !!vpcs.find((vpc) => vpc.VpcId === this.vpcId && vpc.Ipv6CidrBlockAssociationSet && !isEmpty(vpc.Ipv6CidrBlockAssociationSet));
    }

    if (this.isNew && this.somePoolHasIpv6OrDual) {
      this.enableIpv6 = true;
    }
  },

  data() {
    return { selectedNetwork: {}, enableIpv6: false };
  },

  watch: {
    region() {
      if (this.isNew) {
        this.updateNetwork();
      }
    },

    enableIpv6(neu) {
      if (this.isNew) {
        this.updateNetwork();
      }
      this.$emit('update:hasIpv6', neu);

      if (neu) {
        this.$emit('update:ipv6AddressCount', '1');
      } else {
        this.$emit('update:ipv6AddressCount', '0');
        this.$emit('update:ipv6AddressOnly', false);
        this.$emit('update:enablePrimaryIpv6', false);
        this.$emit('update:httpProtocolIpv6', 'disabled');
      }
    },

    ipv6Selected(neu) {
      if (neu) {
        this.$emit('update:ipv6AddressOnly', neu);
      } else if (!this.dualStackSelected) {
        this.$emit('update:ipv6AddressOnly', false);
      }
    },

    ipv6AddressOnly(neu) {
      this.$emit('update:hasIpv6', neu);
    },

    allValid: {
      handler(neu) {
        this.$emit('validationChanged', neu);
      },
      immediate: true
    }
  },

  computed: {
    allNetworkOptions() {
      if ( !this.vpcInfo || !this.subnetInfo ) {
        return [];
      }
      let vpcs = [];
      const subnetsByVpc = {};

      for ( const obj of this.vpcInfo.Vpcs ) {
        const name = obj.Tags && obj.Tags?.length ? obj.Tags.find((t) => t.Key === 'Name')?.Value : null;
        const hasIpv6 = !!obj.Ipv6CidrBlockAssociationSet && !isEmpty(obj.Ipv6CidrBlockAssociationSet);
        const hasIpv4 = !!obj.CidrBlock;

        vpcs.push({
          label:     name || obj.VpcId,
          subLabel:  name ? obj.VpcId : obj.CidrBlock,
          isDefault: obj.IsDefault || false,
          kind:      'vpc',
          value:     obj.VpcId,
          disabled:  this.enableIpv6 !== hasIpv6,
          hasIpv6,
          hasIpv4
        });
      }

      vpcs = sortBy(vpcs, ['isDefault:desc', 'label']);

      for ( const obj of this.subnetInfo.Subnets ) {
        if ( obj.AvailabilityZone !== `${ this.region }${ this.zone }` ) {
          continue;
        }

        const hasIpv6 = !!obj.Ipv6CidrBlockAssociationSet && !isEmpty(obj.Ipv6CidrBlockAssociationSet);
        const hasIpv4 = !!obj.CidrBlock;

        if (this.enableIpv6 !== hasIpv6) {
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
          hasIpv6,
          hasIpv4
        });
      }

      const out = [];

      for ( const obj of vpcs ) {
        if (!obj.disabled || subnetsByVpc[obj.value]) {
          addObject(out, obj);
        }

        if ( subnetsByVpc[obj.value] ) {
          addObjects(out, sortBy(subnetsByVpc[obj.value], ['isDefault:desc', 'label']));
        }
      }

      return out;
    },

    // ipv4-only subnets and vpcs
    ipv4OnlyNetworkOptions() {
      return this.allNetworkOptions.reduce((opts, opt) => {
        if (opt.kind === 'vpc') {
          opts.push({ ...opt, disabled: opt.hasIpv6 });
        } else if (!opt.hasIpv6) {
          opts.push(opt);
        }

        return opts;
      }, []);
    },

    // ipv6-enabled subnets and vpcs - some of these may be both ipv4 and ipv6 (dual-stack)
    ipv6NetworkOptions() {
      return this.allNetworkOptions.filter((opt) => {
        return opt.hasIpv6;
      });
    },

    networkOptions() {
      return this.enableIpv6 ? this.ipv6NetworkOptions : this.ipv4OnlyNetworkOptions;
    },

    // ipv4 and ipv6 subnet or vpc selected
    dualStackSelected() {
      const opt = this.allNetworkOptions.find((o) => o.value === this.selectedNetwork);

      return opt?.hasIpv4 && opt?.hasIpv6;
    },

    // ipv6-only subnet selected (vpc are never ipv6-only)
    ipv6Selected() {
      const opt = this.allNetworkOptions.find((o) => o.value === this.selectedNetwork);

      return opt && opt.hasIpv6 && !opt.hasIpv4;
    },

    somePoolHasIpv6OrDual() {
      return !!this.machinePools.find((p) => p.hasIpv6);
    },

    showIpv6Options() {
      return this.mode === _CREATE || (this.isNew && this.somePoolHasIpv6OrDual) || this.enableIpv6;
    },

    poolsInvalid() {
      const somePoolHasIpv4 = !!this.machinePools.find((p) => !p.hasIpv6);

      return this.somePoolHasIpv6OrDual && somePoolHasIpv4;
    },

    addressCountInvalid() {
      return !!this.ipv6AddressCountValidator(this.ipv6AddressCount);
    },

    allValid() {
      return !this.poolsInvalid && !this.addressCountInvalid;
    }
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

    ipv6AddressCountValidator(val = '0') {
      const value = parseInt(val);
      // 0 or undefined are both acceptable if ipv6 is disabled
      const isValid = this.enableIpv6 ? value > 0 : !value;

      return isValid ? null : this.t('cluster.machineConfig.amazonEc2.ipv6AddressCount.error');
    },

    scrollDown(e) {
      if (e?.target?.localName === 'a') {
        setTimeout(() => {
          scrollToBottom();
        }, 3); // timeout allows the networking tab to render, changing the length of the page, before scrolling
      }
    }
  }
};
</script>

<template>
  <Banner
    v-if="poolsInvalid"
    color="error"
    :label="t('cluster.machineConfig.amazonEc2.ipv6ValidationWarning')"
    data-testid="amazonEc2__ipv6Warning"
  />
  <div
    v-if="showIpv6Options"
    class="row mb-20"
  >
    <div

      class="col span-6"
    >
      <Checkbox
        v-model:value="enableIpv6"
        :disabled="!isNew"
        :label="t('cluster.machineConfig.amazonEc2.enableIpv6.label')"
        data-testid="amazonEc2__enableIpv6"
        :mode="mode"
      />
      <div
        class="text-muted"
        @click="scrollDown"
      >
        <t
          raw
          k="cluster.machineConfig.amazonEc2.enableIpv6.description"
        />
      </div>
    </div>
  </div>
  <div class="row mb-20 ipv6-row">
    <div class="col span-6">
      <LabeledSelect
        :mode="mode"
        :value="selectedNetwork"
        :options="allNetworkOptions"
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
        :disabled="!isNew || !dualStackSelected"
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
        :value="httpProtocolIpv6==='enabled'"
        :disabled="!isNew"
        :label="t('cluster.machineConfig.amazonEc2.httpProtocolIpv6.label')"
        data-testid="amazonEc2__enableIpv6"
        :mode="mode"
        @update:value="e=>$emit('update:httpProtocolIpv6', e ? 'enabled' : 'disabled')"
      />
    </div>
  </div>
  <div
    v-if="enableIpv6"
    class="row mb-10 ipv6-row"
  >
    <div class="col span-3">
      <LabeledInput
        :disabled="!isNew"
        min="1"
        :mode="mode"
        :value="ipv6AddressCount"
        label-key="cluster.machineConfig.amazonEc2.ipv6AddressCount.label"
        data-testid="amazonEc2__ipv6AddressCount"
        :rules="[ipv6AddressCountValidator]"
        @update:value="e=>$emit('update:ipv6AddressCount', e)"
      />
    </div>
    <div class="col span-9">
      <Checkbox
        :disabled="!isNew"
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
