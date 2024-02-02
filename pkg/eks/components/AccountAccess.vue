<script lang="ts">
import { defineComponent } from 'vue';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import SelectCredential from '@shell/edit/provisioning.cattle.io.cluster/SelectCredential.vue';

export default defineComponent({
  name: 'EKSAccountAccess',

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

  async fetch(){
    this.defaultRegions = await this.$store.dispatch('aws/defaultRegions')
  },

  data() {
    return { regions: [] as any[], defaultRegions: [] as string[] };
  },

  watch: {
    isAuthenticated: {
      async handler(neu) {
        if (neu) {
          this.fetchRegions()
        } else {
          if(!this.defaultRegions.includes(this.region)){
            //TODO nb default region?
            this.$emit('update-region', 'us-east-2')
          }
        }
      },
      immediate: true
    }
  },

  methods:{
    async fetchRegions(){
      const { region, credential } = this as any;
      try{
      const ec2Client = await this.$store.dispatch('aws/ec2', { region, cloudCredentialId: credential });

       const res = await ec2Client.describeRegions({})
       this.regions = (res?.Regions||[]).map(r=>r.RegionName)
      } catch (err){console.error(err)}
    },
  },

  computed: {
    // once the credential is validated we can fetch a list of available regions
    isAuthenticated(): boolean {
      return !!this.credential;
    },

    // TODO nb format
    regionOptions(): string[] {
     return this.regions.length? this.regions : this.defaultRegions
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
  <div>
    <div class="row mb-10">
      <LabeledSelect
        :value="region"
        label="Region"
        :options="regionOptions"
        @input="$emit('update-region', $event)"
      />
    </div>
    <div class="mb-10">
      <SelectCredential
        :value="credential"
        data-testid="crueks-select-credential"
        :mode="mode === VIEW ? VIEW : CREATE"
        provider="aws"
        :default-on-cancel="true"
        :showing-form="!!credential"
        class="mt-20"
        :cancel="()=>$emit('cancel-credential')"
        @input="$emit('update-credential', $event)"
      />
    </div>
  </div>
</template>
