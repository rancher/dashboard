<script lang="ts">
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import CreateEditView from '@shell/mixins/create-edit-view';
import ArrayList from '@shell/components/form/ArrayList.vue';
import { VOLUME_TYPE_OPTIONS, HTTP_TOKENS_VALUES } from './constants';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import KeyValue from '@shell/components/form/KeyValue';
import UnitInput from '@shell/components/form/UnitInput';
import { RadioGroup } from '@components/Form/Radio';
import { Checkbox } from '@components/Form/Checkbox';
import { NORMAN } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { convertStringToKV, convertKVToString } from '@shell/utils/object';
import { sortBy } from '@shell/utils/sort';
import { stringify, exceptionToErrorsArray, formatAWSError } from '@shell/utils/error';
import { RcSection, RcSectionBadges, RcSectionActions } from '@components/RcSection';
import { SectionType, SectionMode, SectionBackground } from '@components/RcSection/types';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import RadioGroup from '@components/src/components/Form/Radio/RadioGroup.vue';

const DEFAULT_GROUP = 'rancher-nodes';

export default {
  components: {
    Banner, Loading, RcSection, ArrayList, LabeledInput, KeyValue, LabeledSelect, Checkbox, UnitInput, RadioGroup
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

      console.log('region', region);
      if ( !this.value.region ) {
        this.value['region'] = region;
      }
      console.log('this.value', this.value);

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

    httpTokensOptions() {
      return [
        { label: this.t('capa.machineConfig.instanceConfiguration.advanced.instanceMetadataOptions.httpTokens.options.required'), value: HTTP_TOKENS_VALUES.REQUIRED },
        { label: this.t('capa.machineConfig.instanceConfiguration.advanced.instanceMetadataOptions.httpTokens.options.optional'), value: HTTP_TOKENS_VALUES.OPTIONAL },
      ];
    },

    additionalVolumeTypeOptions() {
      return VOLUME_TYPE_OPTIONS;
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
        <RcSection
          :title="t('capa.machineConfig.instanceConfiguration.title')"
          :expandable="true"
          mode="with-header"
          type="primary"
        >
          <p>{{ t('capa.machineConfig.instanceConfiguration.description') }}</p>

          <LabeledSelect
            v-model:value="value.instanceType"
            :options="instanceTypeOptions"
            label-key="capa.machineConfig.instanceConfiguration.instanceType.label"
            option-key="apiName"
            option-label="label"
            required
          />
          <LabeledSelect
            v-model:value="value.subnet.id"
            :options="subnetOptions"
            label-key="capa.machineConfig.instanceConfiguration.subnet.label"
            required
          />
          <RcSection
            :title="t('capa.machineConfig.instanceConfiguration.advanced.title')"
            :expandable="true"
            mode="with-header"
            type="secondary"
          >
            <LabeledInput
              v-model:value="value.ami.id"
              label-key="capa.machineConfig.instanceConfiguration.advanced.machineImage.label"
              :placeholder="t('capa.machineConfig.instanceConfiguration.advanced.machineImage.placeholder')"
            />
            <LabeledInput
              v-model:value="value.iamInstanceProfile"
              label-key="capa.machineConfig.instanceConfiguration.advanced.iamInstanceProfileName.label"
            />
            <div>
              <LabeledSelect
                v-model:value="value.instanceMetadataOptions.httpTokens"
                :options="httpTokensOptions"
                label-key="capa.machineConfig.instanceConfiguration.advanced.instanceMetadataOptions.httpTokens.label"
              />
              <p class="text-muted text-small mt-5 mb-0">
                {{ t('capa.machineConfig.instanceConfiguration.advanced.instanceMetadataOptions.httpTokens.description') }}
              </p>
            </div>
          </RcSection>
        </RcSection>
        <RcSection
          :title="t('capa.machineConfig.storage.title')"
          :expandable="true"
          mode="with-header"
          type="primary"
        >
          <p>{{ t('capa.machineConfig.storage.description') }}</p>
          <div class="row">
            <UnitInput
              v-model:value="value.rootVolume.size"
              label-key="capa.machineConfig.storage.rootVolume.size.label"
              suffix="GiB"
              class="mr-10"
            />
            <LabeledSelect
              v-model:value="value.rootVolume.type"
              :options="[]"
              label-key="capa.machineConfig.storage.rootVolume.type.label"
              required
            />
          </div>
          <Checkbox
            v-model:value="value.rootVolume.encrypted"
            :label="t('capa.machineConfig.storage.rootVolume.encrypted.label')"
          />
          <LabeledInput
            v-if="value.rootVolume.encrypted"
            v-model:value="value.rootVolume.encryptionKey"
            label-key="capa.machineConfig.storage.rootVolume.encryptionKey.label"
            placeholder-key="capa.machineConfig.storage.rootVolume.encryptionKey.placeholder"
            required
          />
          <RcSection
            :title="t('capa.machineConfig.storage.advanced.title')"
            :expandable="true"
            mode="with-header"
            type="secondary"
          >
            <ArrayList
              v-model:value="value.nonRootVolumes"
              :add-allowed="true"
              :default-add-value="{ deviceName: '', type: 'gp3', size: null }"
              :add-label="t('capa.machineConfig.storage.advanced.additionalVolumes.add')"
              :show-header="true"
              class="mb-10 additional-volumes-list"
            >
              <template #columns="{ row, queueUpdate }">
                <div class="additional-volumes-grid">
                  <LabeledInput
                    v-model:value="row.value.deviceName"
                    label-key="capa.machineConfig.storage.advanced.additionalVolumes.deviceName.label"
                    class="additional-volume-field"
                    @update:value="queueUpdate"
                  />
                  <LabeledSelect
                    v-model:value="row.value.type"
                    :options="additionalVolumeTypeOptions"
                    label-key="capa.machineConfig.storage.advanced.additionalVolumes.type.label"
                    class="additional-volume-field"
                    @update:value="queueUpdate"
                  />
                  <UnitInput
                    v-model:value="row.value.size"
                    label-key="capa.machineConfig.storage.advanced.additionalVolumes.size.label"
                    class="additional-volume-field"
                    suffix="GiB"
                    @update:value="queueUpdate"
                  />
                </div>
              </template>
            </ArrayList>
          </RcSection>
        </RcSection>
        <RcSection
          :title="t('capa.machineConfig.advanced.title')"
          :expandable="true"
          mode="with-header"
          type="primary"
        >
          <div>
            <p>{{ t('capa.machineConfig.advanced.cloudInit.title') }}</p>
            <Checkbox
              v-model:value="value.cloudInit.insecureSkipSecretsManager"
              :label="t('capa.machineConfig.advanced.cloudInit.disable.label')"
              class="mt-10"
            />
          </div>
          <RadioGroup
            v-model:value="value.securityGroup"
            name="security-group"
            :options="[
              { label: t('capa.machineConfig.advanced.securityGroup.options.standard'), value: 'merge' },
              { label: t('capa.machineConfig.advanced.securityGroup.options.existing'), value: 'replace' },
            ]"
            label-key="capa.machineConfig.advanced.securityGroup.label"
            class="mt-20 mb-10"
          />
          <RcSection
            :title="t('capa.machineConfig.advanced.marketType.title')"
            :expandable="true"
            mode="with-header"
            type="secondary"
          >
            <p>{{ t('capa.machineConfig.advanced.marketType.description') }}</p>
            <RadioGroup
              v-model:value="value.marketType"
              name="market-type"
              :options="[
                { label: t('capa.machineConfig.advanced.marketType.options.onDemand'), value: 'on-demand' },
                { label: t('capa.machineConfig.advanced.marketType.options.spot'), value: 'spot' },
                { label: t('capa.machineConfig.advanced.marketType.options.block'), value: 'block' },
              ]"
              class=""
            />
            <div v-if="value.marketType === 'spot'">
              <UnitInput
                v-model:value="value.spotMarketOptions.maxPrice"
                label-key="capa.machineConfig.advanced.marketType.price.label"
                suffix="USD/h"
                class="mb-10"
              />
              <p>{{ t('capa.machineConfig.advanced.marketType.price.description') }}</p>
            </div>
          </RcSection>
          <RcSection
            :title="t('capa.machineConfig.advanced.tags.title')"
            :expandable="true"
            mode="with-header"
            type="secondary"
          >
            <p>{{ t('capa.machineConfig.advanced.tags.description') }}</p>
            <KeyValue
              :mode="mode"
              :read-allowed="false"
              :as-map="true"
              :value="value.additionalTags"
              :addLabel="t('capa.machineConfig.advanced.tags.add')"
              data-testid="eks-resource-tags-input"
              @update:value="$emit('update:tags', $event)"
            />
          </RcSection>
        </RcSection>
      </div>
    </template>
  </div>
</template>

<style lang='scss' scoped>
.additional-volumes-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

.additional-volume-field {
  min-width: 0;
}

@media (max-width: 1024px) {
  .additional-volumes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
