<script lang="ts">
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { PropType, defineComponent } from 'vue';
import { Store, mapGetters } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import Banner from '@components/Banner/Banner.vue';

import RadioGroup from '@components/Form/Radio/RadioGroup.vue';

import { AWS } from '../types';

export default defineComponent({
  name: 'EKSNetworking',

  emits: ['update:subnets', 'update:securityGroups', 'error', 'update:publicAccess', 'update:privateAccess', 'update:publicAccessSources'],

  components: {
    LabeledSelect,
    ArrayList,
    Checkbox,
    RadioGroup,
    Banner
  },

  props: {
    mode: {
      type:    String,
      default: _EDIT
    },

    region: {
      type:    String,
      default: ''
    },

    amazonCredentialSecret: {
      type:    String,
      default: ''
    },

    subnets: {
      type:    Array as PropType<string[]>,
      default: () => []
    },

    securityGroups: {
      type:    Array as PropType<string[]>,
      default: () => []
    },

    publicAccess: {
      type:    Boolean,
      default: false
    },

    privateAccess: {
      type:    Boolean,
      default: false
    },

    publicAccessSources: {
      type:    Array,
      default: () => []
    },

    statusSubnets: {
      type:    Array as PropType<string[]>,
      default: () => []
    },

    rules: {
      type:    Object,
      default: () => {}
    }
  },

  watch: {
    amazonCredentialSecret: {
      handler(neu) {
        if (neu && !this.isView) {
          this.fetchVpcs();
          this.fetchSecurityGroups();
        }
      },
      immediate: true
    },
    region: {
      handler(neu ) {
        if (neu && !this.isView) {
          this.fetchVpcs();
          this.fetchSecurityGroups();
        }
      },
      immediate: true
    },

    'chooseSubnet'(neu: boolean) {
      if (!neu) {
        this.$emit('update:subnets', []);
      }
    },

    selectedVpc(neu: string, old: string) {
      if (!!old) {
        this.$emit('update:securityGroups', []);
      }
    }

  },

  data() {
    return {
      loadingVpcs:           false,
      loadingSecurityGroups: false,
      vpcInfo:               [] as AWS.VPC[],
      subnetInfo:            [] as AWS.Subnet[],
      securityGroupInfo:     {} as {SecurityGroups: AWS.SecurityGroup[]},
      chooseSubnet:          !!this.subnets && !!this.subnets.length
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    // map subnets to VPCs
    // {[vpc id]: [subnets]}
    vpcOptions() {
      const out: {key:string, label:string, _isSubnet?:boolean, kind?:string}[] = [];
      const vpcs: AWS.VPC[] = this.vpcInfo || [];
      const subnets: AWS.Subnet[] = this.subnetInfo || [];
      const mappedSubnets: {[key:string]: AWS.Subnet[]} = {};

      subnets.forEach((s) => {
        if (!mappedSubnets[s.VpcId]) {
          mappedSubnets[s.VpcId] = [s];
        } else {
          mappedSubnets[s.VpcId].push(s);
        }
      });
      vpcs.forEach((v) => {
        const { VpcId = '', Tags = [] } = v;
        const nameTag = Tags.find((t) => {
          return t.Key === 'Name';
        })?.Value;

        const formOption = {
          key: VpcId, label: `${ nameTag } (${ VpcId })`, kind: 'group'
        };

        out.push(formOption);
        if (mappedSubnets[VpcId]) {
          mappedSubnets[VpcId].forEach((s) => {
            const { SubnetId, Tags = [] } = s;
            const nameTag = Tags.find((t) => {
              return t.Key === 'Name';
            })?.Value;

            const subnetFormOption = {
              key:       SubnetId,
              label:     `${ nameTag } (${ SubnetId })`,
              _isSubnet: true,
              disabled:  !!this.selectedVpc && VpcId !== this.selectedVpc
            };

            out.push(subnetFormOption);
          });
        }
      });

      return out;
    },

    securityGroupOptions() {
      const allGroups = this.securityGroupInfo?.SecurityGroups || [];

      return allGroups.reduce((opts, sg) => {
        if (sg.VpcId !== this.selectedVpc) {
          return opts;
        }
        opts.push({
          label: `${ sg.GroupName } (${ sg.GroupId })`,
          value: sg.GroupId
        });

        return opts;
      }, [] as {label: string, value: string}[]);
    },

    displaySubnets: {
      get(): {key:string, label:string, _isSubnet?:boolean, kind?:string}[] | string[] {
        const subnets: string[] = this.chooseSubnet ? this.subnets : this.statusSubnets;

        // vpcOptions will be empty in 'view config' mode, where aws API requests are not made
        return this.vpcOptions.length ? this.vpcOptions.filter((option) => subnets.includes(option.key)) : subnets;
      },
      set(neu: {key:string, label:string, _isSubnet?:boolean, kind?:string}[]) {
        this.$emit('update:subnets', neu.map((s) => s.key));
      }
    },

    selectedVpc() {
      if (!this.chooseSubnet) {
        return null;
      }

      return (this.subnetInfo || []).find((s) => this.subnets.includes(s.SubnetId))?.VpcId;
    },

    isNew(): boolean {
      return this.mode === _CREATE;
    },

    isView():boolean {
      return this.mode === _VIEW;
    }
  },

  methods: {
    async fetchVpcs() {
      this.loadingVpcs = true;
      const { region, amazonCredentialSecret } = this;

      if (!region || !amazonCredentialSecret) {
        return;
      }
      const store: Store<any> = this.$store;
      const ec2Client = await store.dispatch('aws/ec2', { region, cloudCredentialId: amazonCredentialSecret });

      try {
        this.vpcInfo = await this.$store.dispatch('aws/depaginateList', { client: ec2Client, cmd: 'describeVpcs' });
        this.subnetInfo = await this.$store.dispatch('aws/depaginateList', { client: ec2Client, cmd: 'describeSubnets' });
      } catch (err) {
        this.$emit('error', err);
      }
      this.loadingVpcs = false;
    },

    async fetchSecurityGroups() {
      this.loadingSecurityGroups = true;
      const { region, amazonCredentialSecret } = this;

      if (!region || !amazonCredentialSecret) {
        return;
      }
      const store: Store<any> = this.$store;
      const ec2Client = await store.dispatch('aws/ec2', { region, cloudCredentialId: amazonCredentialSecret });

      try {
        this.securityGroupInfo = await ec2Client.describeSecurityGroups({ });
      } catch (err) {
        this.$emit('error', err);
      }
      this.loadingSecurityGroups = false;
    }
  }
});
</script>

<template>
  <div>
    <Banner
      color="info"
      label-key="eks.publicAccess.tooltip"
    />
    <div class="row mb-10">
      <div class="col span-6">
        <Checkbox
          :value="publicAccess"
          :mode="mode"
          label-key="eks.publicAccess.label"
          @update:value="$emit('update:publicAccess', $event)"
        />
        <Checkbox
          :value="privateAccess"
          :mode="mode"
          label-key="eks.privateAccess.label"
          @update:value="$emit('update:privateAccess', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <ArrayList
          :value="publicAccessSources"
          :mode="mode"
          :disabled="!publicAccess"
          :add-allowed="publicAccess"
          :add-label="t('eks.publicAccessSources.addEndpoint')"
          data-testid="eks-public-access-sources"
          @update:value="$emit('update:publicAccessSources', $event)"
        >
          <template #title>
            {{ t('eks.publicAccessSources.label') }}
          </template>
        </ArrayList>
      </div>
    </div>
    <div class="row mb-10 mt-20">
      <div
        v-if="isNew"
        class="col span-6"
      >
        <RadioGroup
          v-model:value="chooseSubnet"
          name="subnet-mode"
          :mode="mode"
          :options="[{label: t('eks.subnets.default'), value: false},{label: t('eks.subnets.useCustom'), value: true}]"
          label-key="eks.subnets.title"
          :disabled="!isNew"
        />
      </div>
    </div>
    <div
      class="row mb-10"
    >
      <div
        v-if="chooseSubnet || !isNew"
        class="col span-6"
      >
        <LabeledSelect
          v-model:value="displaySubnets"
          :disabled="!isNew"
          :mode="mode"
          label-key="eks.vpcSubnet.label"
          :options="vpcOptions"
          :loading="loadingVpcs"
          option-key="key"
          :multiple="true"
          :rules="rules && rules.subnets"
          data-testid="eks-subnets-dropdown"
        >
          <template #option="option">
            <span :class="{'pl-30': option._isSubnet}">{{ option.label }}</span>
          </template>
        </LabeledSelect>
      </div>
      <div
        v-if="chooseSubnet"
        class="col span-6"
      >
        <LabeledSelect
          :mode="mode"
          :disabled="!isNew"
          label-key="eks.securityGroups.label"
          :tooltip="t('eks.securityGroups.tooltip')"
          :options="securityGroupOptions"
          :multiple="true"
          :value="securityGroups"
          :loading="loadingSecurityGroups"
          data-testid="eks-security-groups-dropdown"
          @update:value="$emit('update:securityGroups', $event)"
        />
      </div>
    </div>
  </div>
</template>
