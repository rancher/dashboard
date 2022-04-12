<script>
import { NORMAN } from '@shell/config/types';
import { exceptionToErrorsArray, stringify } from '@shell/utils/error';
import { _CREATE } from '@shell/config/query-params';
import CreateEditView from '@shell/mixins/create-edit-view';
import Loading from '@shell/components/Loading';
import Banner from '@shell/components/Banner';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  components: {
    Loading, Banner, LabeledSelect
  },

  mixins: [CreateEditView],

  props: {
    credentialId: {
      type:     String,
      required: true
    },
    disabled: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    this.errors = [];

    try {
      if ( this.credentialId ) {
        this.credential = await this.$store.dispatch('rancher/find', {
          type: NORMAN.CLOUD_CREDENTIAL,
          id:   this.credentialId
        });
      }
    } catch (e) {
      this.credential = null;
    }

    try {
      this.regionOptions = await this.$store.dispatch('linode/regionOptions', { credentialId: this.credentialId });

      let defaultRegion = 'us-west';

      if ( !this.regionOptions.find(x => x.value === defaultRegion) ) {
        defaultRegion = this.regionOptions[0]?.value;
      }

      const region = this.value.region || this.credential?.defaultRegion || defaultRegion;

      if ( !this.value.region ) {
        this.value.region = region;
      }

      this.instanceOptions = await this.$store.dispatch('linode/instanceOptions', { credentialId: this.credentialId });

      let defaultInstanceType = 'g6-standard-2';

      if ( !this.instanceOptions.find(x => x.value === defaultInstanceType) ) {
        defaultInstanceType = this.instanceOptions.find(x => x.memoryGb >= 4)?.value;

        if ( !defaultInstanceType ) {
          defaultInstanceType = this.instanceOptions[0].value;
        }
      }

      if ( !this.value.instanceType ) {
        this.value.instanceType = defaultInstanceType;
      }

      this.imageOptions = await this.$store.dispatch('linode/imageOptions', { credentialId: this.credentialId });

      let defaultImage = 'linode/ubuntu20.04';

      if ( !this.imageOptions.find(x => x.value === defaultImage) ) {
        defaultImage = this.imageOptions[0].value;
      }

      if ( !this.value.image ) {
        this.value.image = defaultImage;
      }

      this.updateInterfaces();
    } catch (e) {
      this.errors = exceptionToErrorsArray(e);
    }
  },

  data() {
    return {
      credential:      null,
      regionOptions:   null,
      instanceOptions: null,
      imageOptions:    null
    };
  },

  watch: {
    'credentialId'() {
      this.$fetch();
    },
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    }
  },

  methods: {
    stringify,

    updateInterfaces() {
      if ( !this.value.interfaces ) {
        this.value.interfaces = [];
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" :delayed="true" />
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
          v-model="value.region"
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
          v-model="value.instanceType"
          :mode="mode"
          :options="instanceOptions"
          :searchable="true"
          :required="true"
          :disabled="disabled"
          label="Type"
        />
      </div>
    </div>
    <div class="row mt-20">
      <div class="col span-6">
        <LabeledSelect
          v-model="value.image"
          :mode="mode"
          :options="imageOptions"
          :searchable="true"
          :required="true"
          :disabled="disabled"
          label="OS Image"
        />
      </div>
    </div>
  </div>
</template>
