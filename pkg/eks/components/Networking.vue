<script lang="ts">
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { defineComponent } from 'vue';
import { Store, mapGetters } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect/index.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import Banner from '@components/Banner/Banner.vue';

import RadioGroup from '@components/Form/Radio/RadioGroup.vue';

import { AWS } from '../types';

export default defineComponent({
  name: 'EKSNetworking',

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
      type:    Array,
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
        }
      },
      immediate: true
    },
    region: {
      handler(neu ) {
        if (neu && !this.isView) {
          this.fetchVpcs();
        }
      },
      immediate: true
    },

    'chooseSubnet'(neu: boolean) {
      if (!neu) {
        this.$emit('update:subnets', []);
      }
    }

  },

  data() {
    return {
      loadingVpcs:  false,
      vpcInfo:      {} as {Vpcs: AWS.VPC[]},
      subnetInfo:   {} as {Subnets: AWS.Subnet[]},
      chooseSubnet: this.subnets && !!this.subnets.length
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    // map subnets to VPCs
    // {[vpc id]: [subnets]}
    vpcOptions() {
      const out: {key:string, label:string, _isSubnet?:boolean, kind?:string}[] = [];
      const vpcs: AWS.VPC[] = this.vpcInfo?.Vpcs || [];
      const subnets: AWS.Subnet[] = this.subnetInfo?.Subnets || [];
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
              _isSubnet: true
            };

            out.push(subnetFormOption);
          });
        }
      });

      return out;
    },

    displaySubnets: {
      get(): {key:string, label:string, _isSubnet?:boolean, kind?:string}[] {
        return this.vpcOptions.filter((option) => this.subnets.includes(option.key));
      },
      set(neu: {key:string, label:string, _isSubnet?:boolean, kind?:string}[]) {
        this.$emit('update:subnets', neu.map((s) => s.key));
      }
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
        this.vpcInfo = await ec2Client.describeVpcs({ });
        this.subnetInfo = await ec2Client.describeSubnets({ });
      } catch (err) {
        this.$emit('error', err);
      }
      this.loadingVpcs = false;
    },
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
          @input="$emit('update:publicAccess', $event)"
        />
        <Checkbox
          :value="privateAccess"
          :mode="mode"
          label-key="eks.privateAccess.label"
          @input="$emit('update:privateAccess', $event)"
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
          @input="$emit('update:publicAccessSources', $event)"
        >
          <template #title>
            {{ t('eks.publicAccessSources.label') }}
          </template>
        </ArrayList>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <RadioGroup
          v-model="chooseSubnet"
          name="subnet-mode"
          :mode="mode"
          :options="[{label: t('eks.subnets.default'), value: false},{label: t('eks.subnets.useCustom'), value: true}]"
          label-key="eks.subnets.title"
          :disabled="!isNew"
        />
      </div>
      <div
        v-if="chooseSubnet"
        class="col span-6"
      >
        <LabeledSelect
          v-model="displaySubnets"
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
    </div>
  </div>
</template>
