<script>
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import LabeledSelect from '@/components/form/LabeledSelect';
import Checkbox from '@/components/form/Checkbox';
import { SECRET } from '@/config/types';

export default {
  components: {
    Loading, LabeledSelect, Checkbox
  },

  mixins: [CreateEditView],

  props: {
    credentialId: {
      type:     String,
      required: true,
    },
  },

  async fetch() {
    this.credential = await this.$store.dispatch('management/find', { type: SECRET, id: this.credentialId });
    this.regionOptions = await this.$store.dispatch('digitalocean/regionOptions', { credentialId: this.credentialId });

    let defaultRegion = 'sfo3';

    if ( !this.regionOptions.find(x => x.value === defaultRegion) ) {
      defaultRegion = this.regionOptions[0]?.value;
    }

    const region = this.value.region || this.credential.defaultRegion || defaultRegion;

    if ( !this.value.region ) {
      this.value.region = region;
    }

    this.instanceOptions = await this.$store.dispatch('digitalocean/instanceOptions', { credentialId: this.credentialId, region });

    let defaultSize = 's-2vcpu-4gb';

    if ( !this.instanceOptions.find(x => x.value === defaultSize) ) {
      defaultSize = this.instanceOptions.find(x => x.memoryGb >= 4)?.value;

      if ( !defaultSize ) {
        defaultSize = this.instanceOptions[0].value;
      }
    }

    if ( !this.value.size ) {
      this.value.size = defaultSize;
    }

    this.imageOptions = await this.$store.dispatch('digitalocean/imageOptions', { credentialId: this.credentialId, region });

    let defaultImage = 'ubuntu-20-04-x64';

    if ( !this.imageOptions.find(x => x.value === defaultImage) ) {
      defaultImage = this.imageOptions[0].value;
    }

    if ( !this.value.image ) {
      this.value.image = defaultImage;
    }
  },

  data() {
    return {
      credential:      null,
      regionOptions:   null,
      imageOptions:    null,
      instanceOptions: null,
    };
  },

  watch: {
    'credentialId'() {
      this.$fetch();
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" :delayed="true" />
  <div v-else>
    <div class="row mt-20">
      <div class="col span-6">
        <LabeledSelect
          v-model="value.region"
          :options="regionOptions"
          :searchable="true"
          :required="true"
          label="Region"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="value.size"
          :options="instanceOptions"
          :searchable="true"
          :required="true"
          label="Size"
        />
      </div>
    </div>

    <div class="row mt-20">
      <div class="col span-6">
        <LabeledSelect
          v-model="value.image"
          :options="imageOptions"
          :searchable="true"
          :required="true"
          label="OS Image"
        />
      </div>
      <div class="col span-6 pt-5">
        <h3>Additional options</h3>
        <Checkbox v-model="value.monitoring" label="Monitoring" />
        <Checkbox v-model="value.ipv6" label="IPv6" />
        <Checkbox v-model="value.privateNetworking" label="Private Networking" />
      </div>
    </div>
  </div>
</template>
