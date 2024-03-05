<script lang="ts">
import { _EDIT } from '@shell/config/query-params';
import { defineComponent } from 'vue';
import { Store } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';

export default defineComponent({
  name: 'EKSNetworking',

  components: {
    LabeledSelect,
    ArrayList,
    Checkbox,
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
    }
  },

  watch: {
    amazonCredentialSecret: {
      handler(neu) {
        if (neu) {
          this.fetchVpcs();
        }
      },
      immediate: true
    },
    region: {
      handler(neu) {
        if (neu) {
          this.fetchVpcs();
        }
      },
      immediate: true
    },

  },

  data() {
    return {
      loadingVpcs: false,
      vpcInfo:     {} as any,
      subnetInfo:  {} as any
    };
  },

  computed: {
    // map subnets to VPCs
    // {[vpc id]: [subnets]}
    vpcOptions() {
      const out = [] as any[];
      const vpcs = this.vpcInfo?.Vpcs || [];
      const subnets = this.subnetInfo?.Subnets || [];
      const mappedSubnets = {} as any;

      subnets.forEach((s:any) => {
        if (!mappedSubnets[s.VpcId]) {
          mappedSubnets[s.VpcId] = [s];
        } else {
          mappedSubnets[s.VpcId].push(s);
        }
      });
      vpcs.forEach((v: any) => {
        const { VpcId = '', Tags = [] } = v;
        const nameTag = Tags.find((t:any) => {
          return t.Key === 'Name';
        })?.Value;

        const formOption = {
          key: VpcId, label: `${ nameTag } (${ VpcId })`, kind: 'group'
        };

        out.push(formOption);
        if (mappedSubnets[VpcId]) {
          mappedSubnets[VpcId].forEach((s) => {
            const { SubnetId, Tags = [] } = s;
            const nameTag = Tags.find((t:any) => {
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
      get() {
        return this.vpcOptions.filter((option) => this.subnets.includes(option.key));
      },
      set(neu: any) {
        this.$emit('update:subnets', neu.map((s: any) => s.key));
      }
    }
  },

  methods: {
    // todo nb validate that chosen subnets are stilla vailable
    async fetchVpcs() {
      this.loadingVpcs = true;
      const { region, amazonCredentialSecret } = this;

      if (!region || !amazonCredentialSecret) {
        return;
      }
      const store = this.$store as Store<any>;
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
    <div class="row mb-10">
      <div class="col span-6">
        <!-- //TODO nb validate that at least one is enabled -->
        <Checkbox
          :value="publicAccess"
          :mode="mode"
          label="Public Access"
          @input="$emit('update:publicAccess', $event)"
        />
        <Checkbox
          :value="privateAccess"
          :mode="mode"
          label="Private Access"
          @input="$emit('update:privateAccess', $event)"
        />
      </div>
      <div class="col span-6">
        <!-- //TODO nb validate that two+ subnets are chosen and that they are in two+ availabilityzones -->
        <LabeledSelect
          v-model="displaySubnets"
          :mode="mode"
          label="VPC and Subnet"
          :options="vpcOptions"
          :loading="loadingVpcs"
          option-key="key"
          :multiple="true"
        >
          <template #option="option">
            <span :class="{'pl-30': option._isSubnet}">{{ option.label }}</span>
          </template>
        </LabeledSelect>
      </div>
    </div>
    <div class="row mb-10">
      <!-- //TODO nb verify disable state on edit -->
      <div class="col span-6">
        <ArrayList
          :value="publicAccessSources"
          :mode="mode"
          :disabled="!publicAccess"
          :add-allowed="publicAccess"
          add-label="add endpoint"
          @input="$emit('update:publicAccessSources', $event)"
        />
      </div>
    </div>
  </div>
</template>
