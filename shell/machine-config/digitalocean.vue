<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ArrayList from '@shell/components/form/ArrayList';
import { Checkbox } from '@components/Form/Checkbox';
import { NORMAN } from '@shell/config/types';
import { stringify, exceptionToErrorsArray } from '@shell/utils/error';
import { _CREATE } from '@shell/config/query-params';
import { Banner } from '@components/Banner';

export default {
  components: {
    Loading, LabeledSelect, ArrayList, Checkbox, Banner
  },

  mixins: [CreateEditView],

  props: {
    credentialId: {
      type:     String,
      required: true,
    },

    disabled: {
      type:    Boolean,
      default: false
    },
  },

  async fetch() {
    this.errors = [];

    try {
      if ( this.credentialId ) {
        this.credential = await this.$store.dispatch('rancher/find', { type: NORMAN.CLOUD_CREDENTIAL, id: this.credentialId });
      }
    } catch (e) {
      this.credential = null;
    }

    try {
      this.regionOptions = await this.$store.dispatch('digitalocean/regionOptions', { credentialId: this.credentialId });

      let defaultRegion = 'sfo3';

      if ( !this.regionOptions.find((x) => x.value === defaultRegion) ) {
        defaultRegion = this.regionOptions[0]?.value;
      }

      const region = this.value.region || this.credential?.defaultRegion || defaultRegion;

      if ( !this.value.region ) {
        this.value.region = region;
      }

      this.instanceOptions = await this.$store.dispatch('digitalocean/instanceOptions', { credentialId: this.credentialId, region });

      let defaultSize = 's-2vcpu-4gb';

      if ( !this.instanceOptions.find((x) => x.value === defaultSize) ) {
        defaultSize = this.instanceOptions.find((x) => x.memoryGb >= 4)?.value;

        if ( !defaultSize ) {
          defaultSize = this.instanceOptions[0].value;
        }
      }

      if ( !this.value.size ) {
        this.value.size = defaultSize;
      }

      this.imageOptions = await this.$store.dispatch('digitalocean/imageOptions', { credentialId: this.credentialId, region });

      let defaultImage = 'ubuntu-20-04-x64';

      if ( !this.imageOptions.find((x) => x.value === defaultImage) ) {
        defaultImage = this.imageOptions[0].value;
      }

      if ( !this.value.image ) {
        this.value.image = defaultImage;
      }

      this.updateUsername();
    } catch (e) {
      this.errors = exceptionToErrorsArray(e);
    }
  },

  data() {
    let tags = null;

    if (this.value.tags) {
      tags = this.value.tags.split(',');
    }

    return {
      credential:      null,
      regionOptions:   null,
      imageOptions:    null,
      instanceOptions: null,
      tags
    };
  },

  watch: {
    'credentialId'() {
      this.$fetch();
    },

    'value.image': 'updateUsername',
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    }
  },

  methods: {
    stringify,

    updateUsername() {
      if ( this.value.image.match(/rancheros/i) ) {
        this.value.sshUser = 'rancher';
      } else {
        this.value.sshUser = undefined;
      }
    },

    updateTags() {
      this.value.tags = this.tags.join();
    }
  },
};
</script>

<template>
  <Loading
    v-if="$fetchState.pending"
    :delayed="true"
  />
  <div v-else-if="errors.length">
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
  <div v-else>
    <div class="row mt-20">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.region"
          :mode="mode"
          :options="regionOptions"
          :searchable="true"
          :required="true"
          :disabled="disabled"
          label="Region"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.size"
          :mode="mode"
          :options="instanceOptions"
          :searchable="true"
          :required="true"
          :disabled="disabled"
          label="Size"
        />
      </div>
    </div>

    <div class="row mt-20">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.image"
          :mode="mode"
          :options="imageOptions"
          :searchable="true"
          :required="true"
          :disabled="disabled"
          label="OS Image"
        />
      </div>
      <div class="col span-6 pt-5">
        <h3>Additional DigitalOcean Options</h3>
        <Checkbox
          v-model:value="value.monitoring"
          :mode="mode"
          :disabled="disabled"
          label="Monitoring"
        />
        <Checkbox
          v-model:value="value.ipv6"
          :mode="mode"
          :disabled="disabled"
          label="IPv6"
        />
        <Checkbox
          v-model:value="value.privateNetworking"
          :mode="mode"
          :disabled="disabled"
          label="Private Networking"
        />
      </div>
    </div>
    <div class="row mt-20">
      <div class="col span-6">
        <ArrayList
          v-model:value="tags"
          :mode="mode"
          :protip="false"
          :title="t('cluster.machineConfig.digitalocean.tags.label')"
          :value-placeholder="t('cluster.machineConfig.digitalocean.tags.placeholder')"
          :disabled="!isCreate"
          :add-allowed="isCreate"
          :remove-allowed="isCreate"
          @input="updateTags"
        />
      </div>
    </div>
  </div>
</template>
