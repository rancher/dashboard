<script lang="ts">
import { defineComponent } from 'vue';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import SelectCredential from '@shell/edit/provisioning.cattle.io.cluster/SelectCredential.vue';
import { DEFAULT_REGION } from './CruEKS.vue';
import { mapGetters } from 'vuex';
import { AWS } from 'types';

export default defineComponent({
  name: 'EKSAccountAccess',

  emits: ['update-region', 'error', 'cancel-credential', 'update-credential'],

  components: {
    LabeledSelect,
    SelectCredential
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    credential: {
      type:    String,
      default: null
    },

    region: {
      type:    String,
      default: ''
    }
  },

  async fetch() {
    if (this.mode !== _VIEW) {
      this.defaultRegions = await this.$store.dispatch('aws/defaultRegions');
      if (this.defaultRegions.length && !this.region) {
        this.$emit('update-region', DEFAULT_REGION);
      }
    }
  },

  data() {
    return { regions: [] as string[], defaultRegions: [] as string[] };
  },

  watch: {
    isAuthenticated: {
      async handler(neu) {
        if (neu && this.mode !== _VIEW) {
          await this.fetchRegions();
        } else {
          if (this.defaultRegions.length && !this.defaultRegions.includes(this.region)) {
            if (this.defaultRegions.includes(DEFAULT_REGION)) {
              this.$emit('update-region', DEFAULT_REGION);
            } else {
              this.$emit('update-region', this.defaultRegions[0]);
            }
          }
        }
      },
      immediate: true
    }
  },

  methods: {
    async fetchRegions() {
      const { region, credential }: { region: string, credential: string} = this;

      if (!!region && !!credential) {
        try {
          const ec2Client = await this.$store.dispatch('aws/ec2', { region, cloudCredentialId: credential });

          const res: {Regions: AWS.EC2Region[]} = await ec2Client.describeRegions({});

          this.regions = (res?.Regions || []).map((r) => r.RegionName);
        } catch (err) {
          this.$emit('error', this.t('eks.errors.fetchingRegions', { err }));
        }
      }
    },
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    // once the credential is validated we can fetch a list of available regions
    isAuthenticated(): boolean {
      return !!this.credential;
    },

    regionOptions(): string[] {
      return this.regions.length ? this.regions : this.defaultRegions;
    },

    CREATE(): string {
      return _CREATE;
    },

    VIEW(): string {
      return _VIEW;
    },

  },
});
</script>

<template>
  <div
    :class="{'showing-form': !credential}"
    class="credential-region"
  >
    <div class="region mb-10">
      <LabeledSelect
        :disabled="mode!=='create'"
        :value="region"
        label-key="eks.region.label"
        :options="regionOptions"
        @update:value="$emit('update-region', $event)"
      />
    </div>
    <div
      class="select-credential-container mb-10"
    >
      <SelectCredential
        :value="credential"
        data-testid="crueks-select-credential"
        :mode="mode === VIEW ? VIEW : CREATE"
        provider="aws"
        :default-on-cancel="true"
        :showing-form="!credential"
        class="select-credential"
        :cancel="()=>$emit('cancel-credential')"
        @update:value="$emit('update-credential', $event)"
      />
    </div>
  </div>
</template>

<style lang="scss">
  .credential-region {
    display: flex;

    .region {
      flex-basis: 50%;
      flex-grow: 0;
      margin: 0 1.75% 0 0;
    }

    &.showing-form {
      flex-direction: column;
      flex-grow: 1;

      &>.region {
        margin: 0;
      }

      &>.select-credential-container{
      display:flex;
      flex-direction: column;
      flex-grow: 1;
      }
    }

    &>.select-credential-container{
      flex-basis: 50%;

      &>.select-credential{
        flex-grow: 1;
      }

    }
  }

</style>
