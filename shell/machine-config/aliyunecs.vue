<script>
import Loading from '@shell/components/Loading';
import Banner from '@components/Banner/Banner.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import UnitInput from '@shell/components/form/UnitInput';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import ArrayList from '@shell/components/form/ArrayList';
import { NORMAN } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { sortBy } from '@shell/utils/sort';
import { stringify, exceptionToErrorsArray } from '@shell/utils/error';
import { findBy } from '@shell/utils/array';
import { upperFirst } from 'lodash';

const DEFAULT_GROUP = 'docker-machine';
const OPTION_CHARGETYPES = [
  {
    label: 'cluster.machineConfig.aliyunecs.internetChargeTypes.payByTraffic',
    value: 'PayByTraffic'
  },
  {
    label: 'cluster.machineConfig.aliyunecs.internetChargeTypes.payByBandwidth',

    value: 'PayByBandwidth'
  },
];
const DISKS = [
  {
    label: 'cluster.machineConfig.aliyunecs.disk.cloud',
    value: 'cloud'
  },
  {
    label: 'cluster.machineConfig.aliyunecs.disk.ephemeralSsd',
    value: 'ephemeral_ssd'
  },
  {
    label: 'cluster.machineConfig.aliyunecs.disk.ssd',
    value: 'cloud_ssd'
  },
  {
    label: 'cluster.machineConfig.aliyunecs.disk.efficiency',
    value: 'cloud_efficiency'
  },
  {
    label: 'cluster.machineConfig.aliyunecs.disk.essd',
    value: 'cloud_essd'
  },
  {
    label: 'cluster.machineConfig.aliyunecs.disk.auto',
    value: 'cloud_auto'
  },
];

const periodWeek = ['1'];
const periodMonth = ['1', '2', '3', '6', '12', '24', '36', '48', '60'];

export default {
  components: {
    Banner, Loading, LabeledInput, LabeledSelect, Checkbox, RadioGroup, UnitInput, KeyValue, ArrayList
  },

  mixins: [CreateEditView],

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

    createOption: {
      default: (text) => {
        if (text) {
          return text;
        }
      },
      type: Function
    },
  },

  async fetch() {
    this.errors = [];
    const cloudCredentialId = this.credentialId;

    if ( !cloudCredentialId ) {
      return;
    }

    if (!this.defaultValue) {
      this.defaultValue = this.$store.getters['aliyun/defaultValue'];
    }

    try {
      if ( this.credential?.id !== cloudCredentialId ) {
        this.credential = await this.$store.dispatch('rancher/find', { type: NORMAN.CLOUD_CREDENTIAL, id: cloudCredentialId });
      }
    } catch (e) {
      this.credential = null;
    }

    if (!this.regions) {
      this.regions = await this.$store.dispatch('aliyun/regions', { cloudCredentialId });
    }

    try {
      const region = this.value.region || this.$store.getters['aliyun/defaultRegion'];
      const hash = {};

      if ( !this.value.region ) {
        this.value.region = region;
      }

      if ( !this.value.resourceGroupId ) {
        this.value.resourceGroupId = '';
      }

      if (!this.resourceGroups) {
        hash.resourceGroups = this.$store.dispatch('aliyun/resourceGroups', { cloudCredentialId });
      }

      if ( this.loadedRegionalFor !== region ) {
        const { resourceGroupId } = this.value;

        hash.zones = this.$store.dispatch('aliyun/zones', { cloudCredentialId, regionId: region });
        hash.vpcs = this.$store.dispatch('aliyun/vpcs', {
          cloudCredentialId, regionId: region, resourceGroupId
        });
        hash.instanceTypes = this.$store.dispatch('aliyun/instanceTypes', { cloudCredentialId, regionId: region });
      }

      hash.availableInstanceTypes = this.$store.dispatch('aliyun/availableInstanceTypes', {
        cloudCredentialId, regionId: region, destinationResource: 'InstanceType', zoneId: this.value?.zone, instanceChargeType: this.value?.instanceChargeType
      });

      const res = await allHash(hash).then((h) => {
        const out = (h.instanceTypes || this.instanceTypes).filter(obj => h.availableInstanceTypes.includes(obj.InstanceTypeId));

        h.availableInstanceTypes = sortBy(out, ['isDefault:desc', 'InstanceTypeFamily']);

        return h;
      });

      for ( const k in res ) {
        this[k] = res[k];
      }

      if (!this.value?.zone || !findBy(this.zoneOptions, 'value', this.value.zone )) {
        this.value.zone = this.defaultValue.zone;
      }

      if (!this.value?.vpcId || !findBy(this.vpcOptions, 'value', this.value.vpcId )) {
        this.value.vpcId = this.defaultValue.vpcId;
      }

      if (!this.value?.instanceType || !findBy(this.instanceOptions, 'value', this.value.instanceType )) {
        this.value.instanceType = this.instanceOptions?.[1]?.value;
      }

      if (!this.value?.upgradeKernel) {
        this.$set(this.value, 'upgradeKernel', false);
      }
      if (!this.value?.ioOptimized) {
        this.$set(this.value, 'ioOptimized', 'optimized');
      }
      if (!this.value?.diskFs) {
        this.$set(this.value, 'diskFs', 'ext4');
      }
      if (!this.value?.internetChargeType) {
        this.$set(this.value, 'internetChargeType', 'PayByTraffic');
      }
      if (!this.value?.instanceChargeType) {
        this.$set(this.value, 'instanceChargeType', this.defaultValue?.instanceChargeType);
      }
      if (!this.value?.openPort || !this.value?.openPort.length) {
        this.$set(this.value, 'openPort', this.defaultValue?.openPort);
      }

      this.initTags();
      this.loadedRegionalFor = region;
    } catch (e) {
      this.errors = exceptionToErrorsArray(e);
    }
  },

  data() {
    return {
      securityGroupMode:     'default',
      instanceChargeType:    'PostPaid',
      tag:                   null,
      loadedRegionalFor:     null,
      loadedZoneFor:         null,
      loadedInstanceFor:     null,
      loadedIoOptiomizedFor: null,

      regions:                null,
      resourceGroups:         null,
      zones:                  null,
      vpcs:                   null,
      vSwitches:              null,
      securityGroups:         null,
      instanceTypes:          null,
      availableInstanceTypes: null,
      images:                 null,
      systemDiskCategories:   null,
      dataDiskCategories:     null,
      periodUnit:             null,
      spotDuration:           true,
      imageType:              null,
      imageVersionChoose:     [],
    };
  },

  mounted() {
    this.value?.vpcId && this.vpcChangeFetch();
    this.value?.instanceType && this.instanceChangeFetch();

    this.initInstanceChargeType();
  },

  watch: {
    'credentialId'() {
      this.$fetch();
    },
    'spotDuration'(neu) {
      this.value.spotDuration = neu ? '1' : '0';
    },
    'value.resourceGroupId'() {
      this.loadedRegionalFor = null;
      this.$fetch();
    },
    'value.region'(val) {
      this.$fetch();
    },
    'value.zone'(val) {
      if (val) {
        this.$fetch();
        this.instanceChangeFetch();
      }
    },
    'value.vpcId'() {
      this.vpcChangeFetch();
    },
    'value.instanceType'() {
      this.instanceChangeFetch();
    },
    'instanceChargeType'(val) {
      this.value.instanceChargeType = val;
      if (val === 'SpotStrategy') {
        this.value.instanceChargeType = this.defaultValue?.instanceChargeType;
        this.value.spotDuration = '1';
        this.spotDuration = true;
        this.$set(this.value, 'spotStrategy', 'SpotAsPriceGo');
      } else {
        this.value.spotStrategy = this.defaultValue.spotStrategy;
        delete this.value.spotDuration;
        delete this.value.spotStrategy;
      }
      if (this.value.instanceChargeType === this.defaultValue?.instanceChargeType) {
        delete this.value.period;
        delete this.value.periodUnit;
      }
      this.getAvailableInstanceTypes();
    },
    'periodUnit'(val) {
      if (val) {
        const ary = val.split('_');

        if (ary[1]) {
          this.value.period = ary[0];
          this.value.periodUnit = ary[1];
        }
      } else {
        delete this.value.period;
        delete this.value.periodUnit;
      }
    },
    'securityGroupMode'(val) {
      if (val === 'default') {
        this.value.securityGroup = DEFAULT_GROUP;
      } else if (this.value?.securityGroup === DEFAULT_GROUP && !findBy(this.securityGroupOptions, 'value', this.value.securityGroup )) {
        this.value.securityGroup = null;
      }
    },
  },

  methods: {
    stringify,

    async vpcChangeFetch() {
      const cloudCredentialId = this.credentialId;
      const { region, vpcId, ResourceGroupId } = this.value;

      if (!vpcId) {
        return;
      }

      this.vSwitches = await this.$store.dispatch('aliyun/vSwitches', {
        cloudCredentialId, regionId: region, vpcId, ResourceGroupId
      });
      this.securityGroups = await this.$store.dispatch('aliyun/securityGroups', {
        cloudCredentialId, regionId: region, vpcId,
      });

      if (!this.value?.vswitchId || !findBy(this.vSwitcheOptions, 'value', this.value.vswitchId )) {
        this.value.vswitchId = this.defaultValue.vswitchId;
      }

      if (this.value?.securityGroup && (findBy(this.securityGroupOptions, 'value', this.value.securityGroup) || this.value?.securityGroup !== DEFAULT_GROUP)) {
        this.securityGroupMode = 'custom';
      } else {
        this.securityGroupMode = 'default';
      }
    },
    async instanceChangeFetch() {
      const cloudCredentialId = this.credentialId;
      const {
        region, instanceType, zone: zoneId, ioOptimized
      } = this.value;
      const hash = {};

      if (!instanceType) {
        return;
      }

      hash.images = this.$store.dispatch('aliyun/images', {
        cloudCredentialId, regionId: region, instanceType, imageOwnerAlias: 'system', isSupportIoOptimized: true, resourceGroupId: this.value?.resourceGroupId,
      });
      hash.systemDiskCategories = this.$store.dispatch('aliyun/systemDiskCategories', {
        cloudCredentialId, regionId: region, zoneId, instanceType, networkCategory: 'vpc', ioOptimized, destinationResource: 'SystemDisk',
      });
      hash.dataDiskCategories = this.$store.dispatch('aliyun/dataDiskCategories', {
        cloudCredentialId, regionId: region, zoneId, instanceType, systemDiskCategory: this.value?.systemDiskCategory, networkCategory: 'vpc', ioOptimized, destinationResource: 'DataDisk',
      });

      const res = await allHash(hash);

      for ( const k in res ) {
        this[k] = res[k];
      }

      let imageType = this.imageType;
      let imageVersionChoose = this.imageVersionChoose;

      if (!this.value?.imageId) {
        imageType = imageType || this.imageTypeChoose?.[0]?.value;
        imageVersionChoose = this.groupImages?.[imageType] || [] ;
        this.value.imageId = imageVersionChoose?.[0].value;
      } else {
        const found = findBy(this.images, 'ImageId', this.value.imageId);

        if (found) {
          imageType = found?.Platform;
          imageVersionChoose = this.groupImages?.[imageType] || [] ;
        } else {
          imageVersionChoose = this.groupImages?.[imageType] || [] ;
          this.value.imageId = imageVersionChoose?.[0]?.value;
        }
      }

      this.imageType = imageType;
      this.imageVersionChoose = imageVersionChoose;

      if (!this.value?.systemDiskCategory || !findBy(this.systemDiskCategoryOptions, 'value', this.value.systemDiskCategory )) {
        this.value.systemDiskCategory = this.systemDiskCategoryOptions?.[0]?.value;
      }
      if (!this.value?.diskCategory || !findBy(this.diskCategoryOptions, 'value', this.value.diskCategory )) {
        this.value.diskCategory = this.diskCategoryOptions?.[0]?.value;
      }
    },
    updateTags(tag) {
      const ary = [];

      for ( const k in tag ) {
        ary.push(`${ k }=${ tag[k] }`);
      }

      this.$set(this.value, 'tag', ary);
    },

    initTags() {
      const parts = this.value.tag || [];
      const out = {};

      let i = 0;

      while ( i < parts.length ) {
        const arr = parts[i].split('=');
        const key = arr[0];
        const value = arr[1];

        if ( key ) {
          out[key] = value;
        }

        i += 1;
      }

      this.tag = out;
    },

    test() {
      const errors = [];
      const requiredList = ['zone', 'vpcId', 'vswitchId', 'instanceType', 'diskFs', 'internetChargeType', 'imageId', 'systemDiskCategory', 'diskCategory', 'instanceChargeType'];

      requiredList.forEach((item) => {
        if (!this.value?.[item]) {
          const key = this.t(`cluster.machineConfig.aliyunecs.${ item }.label`);

          errors.push(this.t('validation.required', { key }, true));
        }
      });

      if (this.instanceChargeType === 'PrePaid') {
        if (!this.value.period) {
          const key = this.t('cluster.machineConfig.aliyunecs.periodUnit.label');

          errors.push(this.t('validation.required', { key }, true));
        }
      } else if (this.instanceChargeType === 'SpotStrategy' && this.value.spotStrategy === 'SpotWithPriceLimit') {
        if (!this.value.spotPriceLimit) {
          const key = this.t('cluster.machineConfig.aliyunecs.spotPriceLimit.label');

          errors.push(this.t('validation.required', { key }, true));
        }
      }

      return { errors };
    },

    unitInputRangeLimit(min, max, key) {
      const value = this.value?.[key];

      if (!value) {
        return;
      }

      if (value < min) {
        this.value[key] = min.toString();
      }

      if (value > max) {
        this.value[key] = max.toString();
      }
    },
    initInstanceChargeType() {
      let instanceChargeType = this.value?.instanceChargeType || this.instanceChargeType;

      if (instanceChargeType === 'PrePaid') {
        this.$set(this, 'periodUnit', `${ this.value.period }_${ this.value.periodUnit }`);
      }

      if (this.value.spotStrategy && this.value.spotStrategy !== 'NoSpot') {
        instanceChargeType = 'SpotStrategy';
      }

      this.$set(this, 'instanceChargeType', instanceChargeType);
    },

    getAvailableInstanceTypes() {
      const hash = {};
      const cloudCredentialId = this?.credentialId;
      const regionId = this.value.region;

      hash.availableInstanceTypes = this.$store.dispatch('aliyun/availableInstanceTypes', {
        cloudCredentialId, regionId, destinationResource: 'InstanceType', zoneId: this.value?.zone, instanceChargeType: this.value?.instanceChargeType
      });

      allHash(hash).then((h) => {
        const out = (this.instanceTypes || []).filter(obj => h.availableInstanceTypes.includes(obj.InstanceTypeId));

        this.availableInstanceTypes = sortBy(out, ['isDefault:desc', 'InstanceTypeFamily']);

        if (!h.availableInstanceTypes.includes(this.value.instanceType)) {
          this.value.instanceType = '';
        }

        return h;
      });
    },

    imageTypeChanged(val) {
      let imageVersionChoose = [];

      if (val && this.groupImages) {
        imageVersionChoose = this.groupImages[val];
      }

      this.imageVersionChoose = imageVersionChoose;
      this.value.imageId = imageVersionChoose.length ? imageVersionChoose[0]?.value : '';
    },
  },

  computed: {
    defaultGroup() {
      return DEFAULT_GROUP;
    },
    securityGroupLabels() {
      return [
        this.t('cluster.machineConfig.aliyunecs.securityGroup.mode.default', { defaultGroup: DEFAULT_GROUP }),
        this.t('cluster.machineConfig.aliyunecs.securityGroup.mode.custom')
      ];
    },
    regionOptions() {
      if ( !this.regions ) {
        return [];
      }

      return this.regions.map((obj) => {
        return {
          label: obj.LocalName,
          value: obj.RegionId,
        };
      });
    },
    zoneOptions() {
      if ( !this.zones ) {
        return [];
      }

      return this.zones.map((obj) => {
        return {
          label: obj.LocalName,
          value: obj.ZoneId,
        };
      });
    },
    resourceGroupOptions() {
      if ( !this.resourceGroups ) {
        return [];
      }

      const out = this.resourceGroups.map((obj) => {
        return {
          label: `${ obj.DisplayName || obj.Name } (${ obj.Id })`,
          value: obj.Id,
        };
      }).sort();

      out.unshift({
        label: this.t('cluster.machineConfig.aliyunecs.resourceGroup.all'),
        value: ''
      });

      return out;
    },
    vpcOptions() {
      if ( !this.vpcs ) {
        return [];
      }

      return this.vpcs.map((obj) => {
        return {
          label: `${ obj.IsDefault ? this.t('cluster.machineConfig.aliyunecs.vpcId.default') : obj.VpcName } (${ obj.VpcId })`,
          value: obj.VpcId,
        };
      }).sort();
    },
    securityGroupOptions() {
      if ( !this.securityGroups ) {
        return [];
      }

      return this.securityGroups.map((obj) => {
        return {
          label: `${ obj.SecurityGroupName } (${ obj.SecurityGroupId })`,
          value: obj.SecurityGroupName,
        };
      }).sort();
    },
    vSwitcheOptions() {
      if ( !this.vSwitches ) {
        return [];
      }

      return this.vSwitches.filter(i => i.ZoneId === this.value.zone).map((obj) => {
        return {
          label: `${ obj.IsDefault ? this.t('cluster.machineConfig.aliyunecs.vswitchId.default') : obj.VSwitchName } (${ obj.VSwitchId })`,
          value: obj.VSwitchId,
        };
      }).sort();
    },
    internetChargeTypeOptions() {
      return OPTION_CHARGETYPES.map(item => ({
        value: item.value,
        label: this.t(item.label),
      }));
    },
    instanceOptions() {
      if ( !this.availableInstanceTypes ) {
        return [];
      }

      let lastGroup;
      const out = [];
      const children = [];

      this.availableInstanceTypes.forEach((obj) => {
        if (obj.InstanceTypeFamily !== lastGroup) {
          if (children.length) {
            out.push(...sortBy(children, 'cpuCoreCount'));
          }
          children.length = 0;

          out.push({
            kind:     'group',
            disabled: true,
            label:    obj.InstanceTypeFamily
          });

          lastGroup = obj.InstanceTypeFamily;
        }
        children.push({
          label:        `${ obj.InstanceTypeId } ( ${ obj.CpuCoreCount } ${ obj.CpuCoreCount > 1 ? 'Cores' : 'Core' } ${ obj.MemorySize }GB RAM )`,
          value:        obj.InstanceTypeId,
          cpuCoreCount: obj.CpuCoreCount
        });
      });

      if (children.length) {
        out.push(...sortBy(children, 'cpuCoreCount'));
      }

      return out;
    },
    groupImages() {
      if ( !this.images ) {
        return [];
      }

      const out = {};

      this.images.forEach((obj) => {
        if (!out[obj.Platform]) {
          out[obj.Platform] = [];
        }

        out[obj.Platform].push({
          label: obj.ImageOwnerAlias === 'system' ? obj.OSName : obj.ImageName,
          value: obj.ImageId,
          raw:   obj,
        });
      });

      return out;
    },
    imageTypeChoose() {
      return Object.keys(this.groupImages).map((key) => {
        return {
          label: key,
          value: key
        };
      });
    },
    systemDiskCategoryOptions() {
      if ( !this.systemDiskCategories ) {
        return [];
      }

      const out = [];

      DISKS.forEach((disk) => {
        if (this.systemDiskCategories.includes(disk.value)) {
          out.push({
            label: disk?.label ? this.t(disk.label) : disk.value,
            value: disk.value,
          });
        }
      });

      return out;
    },
    diskCategoryOptions() {
      if ( !this.dataDiskCategories ) {
        return [];
      }

      const out = [];

      DISKS.forEach((disk) => {
        if (this.dataDiskCategories.includes(disk.value)) {
          out.push({
            label: disk?.label ? this.t(disk.label) : disk.value,
            value: disk.value,
          });
        }
      });

      return out;
    },
    instanceChargeTypeOptions() {
      const options = ['prePaid', 'postPaid', 'spotStrategy'];

      return options.map((o) => {
        return {
          label: this.t(`cluster.machineConfig.aliyunecs.instanceChargeType.${ o }`),
          value: upperFirst(o),
        };
      });
    },
    periodUnitOptions() {
      const out = [];

      periodWeek.forEach((item) => {
        out.push({
          label: `${ item }${ this.t('cluster.machineConfig.aliyunecs.periodUnit.week') }`,
          value: `${ item }_Week`
        });
      });

      periodMonth.forEach((item) => {
        const month = Number(item);
        let label = '';

        if (month === 6) {
          label = `${ this.t('cluster.machineConfig.aliyunecs.periodUnit.half') }${ this.t('cluster.machineConfig.aliyunecs.periodUnit.year') }`;
        } else if (month % 12 === 0) {
          const year = month / 12;

          label = `${ year } ${ this.t('cluster.machineConfig.aliyunecs.periodUnit.year') }`;
        } else {
          label = `${ item } ${ this.t('cluster.machineConfig.aliyunecs.periodUnit.month') }`;
        }

        out.push({
          label,
          value: `${ item }_Month`
        });
      });

      return out;
    },
    systemDiskCategorySize() {
      const size = this.defaultValue.systemDiskSize;

      if ( this.value.systemDiskCategory && this.value.systemDiskCategory === 'cloud_auto' ) {
        size.Min = 40;
        this.unitInputRangeLimit(size.Min, size.Max, 'systemDiskSize');
      } else {
        size.Min = 20;
      }

      return size;
    },
    diskCategorySize() {
      const size = this.defaultValue.dataDiskSize;

      if ( this.value.diskCategory && this.value.diskCategory === 'cloud_auto' ) {
        size.Min = 40;
        this.unitInputRangeLimit(size.Min, size.Max, 'diskSize');
      } else {
        size.Min = 20;
      }

      return size;
    }
  }
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

      <div class="row mb-20">
        <div class="col span-6">
          <LabeledSelect
            v-model="value.resourceGroupId"
            :mode="mode"
            :options="resourceGroupOptions"
            :required="true"
            :disabled="disabled"
            :label="t('cluster.machineConfig.aliyunecs.resourceGroup.label')"
          />
        </div>
        <div class="col span-6">
          <LabeledSelect
            v-model="value.region"
            :mode="mode"
            :options="regionOptions"
            :required="true"
            :searchable="true"
            :disabled="disabled"
            :label="t('cluster.machineConfig.aliyunecs.region.label')"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledSelect
            v-model="value.zone"
            :mode="mode"
            :options="zoneOptions"
            :required="true"
            :disabled="disabled"
            :label="t('cluster.machineConfig.aliyunecs.zone.label')"
            :placeholder="t('cluster.machineConfig.aliyunecs.zone.prompt')"
          />
        </div>
        <div class="col span-6">
          <LabeledSelect
            v-model="value.vpcId"
            :mode="mode"
            :options="vpcOptions"
            :required="true"
            :searchable="true"
            :disabled="disabled"
            :label="t('cluster.machineConfig.aliyunecs.vpcId.label')"
            :placeholder="t('cluster.machineConfig.aliyunecs.vpcId.prompt')"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledSelect
            v-model="value.vswitchId"
            :mode="mode"
            :options="vSwitcheOptions"
            :required="true"
            :searchable="true"
            :disabled="disabled"
            :label="t('cluster.machineConfig.aliyunecs.vswitchId.label')"
            :placeholder="t('cluster.machineConfig.aliyunecs.vswitchId.prompt')"
          />
        </div>
        <div class="col span-6">
          <LabeledSelect
            v-model="value.internetChargeType"
            :mode="mode"
            :options="internetChargeTypeOptions"
            :required="true"
            :searchable="true"
            :disabled="disabled"
            :label="t('cluster.machineConfig.aliyunecs.internetChargeType.label')"
            :placeholder="t('cluster.machineConfig.aliyunecs.internetChargeType.prompt')"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledSelect
            v-model="value.instanceType"
            :mode="mode"
            :options="instanceOptions"
            :required="true"
            :selectable="option => !option.disabled"
            :searchable="true"
            :disabled="disabled"
            :label="t('cluster.machineConfig.aliyunecs.instanceType.label')"
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
        <div class="col span-6">
          <LabeledSelect
            v-model="value.diskFs"
            :mode="mode"
            :options="['ext4','xfs']"
            :required="true"
            :disabled="disabled"
            :label="t('cluster.machineConfig.aliyunecs.diskFs.label')"
          />
        </div>
      </div>

      <div class="row mb-20">
        <div class="col span-6">
          <LabeledSelect
            v-model="imageType"
            :mode="mode"
            :options="imageTypeChoose"
            :required="true"
            :searchable="true"
            :disabled="disabled"
            :label="t('cluster.machineConfig.aliyunecs.imageId.label')"
            :placeholder="t('cluster.machineConfig.aliyunecs.imageId.placeholder')"
            @input="imageTypeChanged"
          />
        </div>
        <div class="col span-6">
          <LabeledSelect
            v-model="value.imageId"
            :mode="mode"
            :options="imageVersionChoose"
            :required="true"
            :searchable="true"
            :disabled="disabled"
            :label="t('cluster.machineConfig.aliyunecs.systemImageVersion.label')"
            :placeholder="t('cluster.machineConfig.aliyunecs.systemImageVersion.placeholder')"
          />
        </div>
      </div>

      <div class="row mb-20">
        <div class="col span-6">
          <LabeledSelect
            v-model="value.systemDiskCategory"
            :mode="mode"
            :options="systemDiskCategoryOptions"
            :required="true"
            :searchable="true"
            :disabled="disabled"
            :label="t('cluster.machineConfig.aliyunecs.systemDiskCategory.label')"
          />
        </div>
        <div class="col span-6">
          <UnitInput
            v-model="value.systemDiskSize"
            output-as="string"
            :mode="mode"
            :min="20"
            :max="500"
            :disabled="disabled"
            :label="t('cluster.machineConfig.aliyunecs.systemDiskSize.label')"
            :placeholder="t('cluster.machineConfig.aliyunecs.systemDiskSize.placeholder', {min: systemDiskCategorySize.Min, max: systemDiskCategorySize.Max})"
            :suffix="t('cluster.machineConfig.aliyunecs.systemDiskSize.suffix')"
            @input="unitInputRangeLimit(20, 500, 'systemDiskSize')"
          />
        </div>
      </div>

      <div class="row mb-20">
        <div class="col span-6">
          <UnitInput
            v-model="value.internetMaxBandwidth"
            output-as="string"
            :mode="mode"
            :disabled="disabled"
            :min="1"
            :max="100"
            :label="t('cluster.machineConfig.aliyunecs.internetMaxBandwidth.label')"
            :placeholder="t('cluster.machineConfig.aliyunecs.internetMaxBandwidth.placeholder')"
            :suffix="t('cluster.machineConfig.aliyunecs.internetMaxBandwidth.suffix')"
            @input="unitInputRangeLimit(1, 100, 'internetMaxBandwidth')"
          />
        </div>
      </div>

      <portal :to="'advanced-'+uuid">
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="value.slbId"
              :mode="mode"
              :disabled="disabled"
              :placeholder="t('cluster.machineConfig.aliyunecs.aliyunSLB.placeholder')"
              :label="t('cluster.machineConfig.aliyunecs.aliyunSLB.label')"
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledSelect
              v-model="value.diskCategory"
              :mode="mode"
              :options="diskCategoryOptions"
              :required="true"
              :searchable="true"
              :disabled="disabled"
              :label="t('cluster.machineConfig.aliyunecs.diskCategory.label')"
            />
          </div>
          <div class="col span-6">
            <UnitInput
              v-model="value.diskSize"
              output-as="string"
              :mode="mode"
              :min="20"
              :max="32768"
              :disabled="disabled"
              :label="t('cluster.machineConfig.aliyunecs.diskSize.label')"
              :placeholder="t('cluster.machineConfig.aliyunecs.diskSize.placeholder', {min: diskCategorySize.Min, max: diskCategorySize.Max})"
              :suffix="t('cluster.machineConfig.aliyunecs.diskSize.suffix')"
              @input="unitInputRangeLimit(20, 32768, 'diskSize')"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledSelect
              v-model="instanceChargeType"
              :mode="mode"
              :options="instanceChargeTypeOptions"
              :required="true"
              :searchable="true"
              :disabled="disabled"
              :label="t('cluster.machineConfig.aliyunecs.instanceChargeType.label')"
            />
          </div>
          <div
            v-if="instanceChargeType === 'PrePaid'"
            class="col span-6"
          >
            <LabeledSelect
              v-model="periodUnit"
              :mode="mode"
              :options="periodUnitOptions"
              :required="true"
              :searchable="true"
              :disabled="disabled"
              :placeholder="t('cluster.machineConfig.aliyunecs.periodUnit.placeholder')"
              :label="t('cluster.machineConfig.aliyunecs.periodUnit.label')"
            />
          </div>
        </div>

        <div
          v-if="instanceChargeType === 'SpotStrategy'"
          class="row mb-20"
        >
          <div class="col span-6">
            <div class="title">
              <h3>
                {{ t('cluster.machineConfig.aliyunecs.spotDuration.label') }}
              </h3>
            </div>
            <RadioGroup
              v-model="spotDuration"
              name="spotDuration"
              :mode="mode"
              :disabled="disabled"
              :labels="[t('cluster.machineConfig.aliyunecs.spotDuration.default'), t('cluster.machineConfig.aliyunecs.spotDuration.none')]"
              :options="[true,false]"
            />
          </div>
          <div class="col span-6">
            <div class="title">
              <h3>{{ t('cluster.machineConfig.aliyunecs.spotStrategy.label') }}</h3>
            </div>
            <RadioGroup
              v-model="value.spotStrategy"
              name="spotStrategy"
              :mode="mode"
              :disabled="disabled"
              :labels="[t('cluster.machineConfig.aliyunecs.spotStrategy.spotAsPriceGo'), t('cluster.machineConfig.aliyunecs.spotStrategy.spotWithPriceLimit')]"
              :options="['SpotAsPriceGo', 'SpotWithPriceLimit']"
            />
            <UnitInput
              v-if="value.spotStrategy === 'SpotWithPriceLimit'"
              v-model="value.spotPriceLimit"
              output-as="string"
              :mode="mode"
              :min="0"
              :max="10000"
              :max-precision="3"
              :disabled="disabled"
              :suffix="t('cluster.machineConfig.aliyunecs.spotStrategy.suffix')"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <div class="title">
              <h3>{{ t('cluster.machineConfig.aliyunecs.ioOptimized.label') }}</h3>
            </div>
            <RadioGroup
              v-model="value.ioOptimized"
              name="ioOptimized"
              :mode="mode"
              :disabled="disabled"
              :labels="[t('generic.yes'), t('generic.no')]"
              :options="['optimized','none']"
            />
          </div>
          <div class="col span-6">
            <div class="title">
              <h3>{{ t('cluster.machineConfig.aliyunecs.upgradeKernel.label') }}</h3>
            </div>
            <RadioGroup
              v-model="value.upgradeKernel"
              name="upgradeKernel"
              :mode="mode"
              :disabled="disabled"
              :labels="[t('generic.yes'), t('generic.no')]"
              :options="[true,false]"
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

        <div class="row mt-20">
          <div class="col span-12">
            <h3>
              {{ t('cluster.machineConfig.aliyunecs.securityGroup.title') }}
              <span
                v-if="!value.vpcId"
                class="text-muted text-small"
              >
                {{ t('cluster.machineConfig.aliyunecs.securityGroup.vpcId') }}
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
              :taggable="true"
              :create-option="createOption"
            />
          </div>
        </div>

        <div class="row mt-20">
          <div class="col span-12">
            <div>
              <Checkbox
                v-model="value.privateAddressOnly"
                :mode="mode"
                :disabled="disabled"
                :label="t('cluster.machineConfig.aliyunecs.privateAddressOnly.label')"
              />
            </div>
          </div>
        </div>
        <div class="row mt-20">
          <div class="col span-12">
            <KeyValue
              :value="tag"
              :mode="mode"
              :read-allowed="false"
              :label="t('cluster.machineConfig.aliyunecs.tagTitle')"
              :add-label="t('labels.addTag')"
              :disabled="disabled"
              @input="updateTags"
            />
          </div>
        </div>
      </portal>
    </template>
  </div>
</template>
