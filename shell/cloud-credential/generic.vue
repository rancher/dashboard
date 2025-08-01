<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import KeyValue from '@shell/components/form/KeyValue';
import { Banner } from '@components/Banner';
import { simplify, iffyFields, likelyFields } from '@shell/store/plugins';
import Loading from '@shell/components/Loading';
import { SCHEMA } from '@shell/config/types';

export default {
  emits: ['validationChanged'],

  components: {
    KeyValue, Banner, Loading
  },
  mixins: [CreateEditView],

  props: {
    driverName: {
      type:     String,
      required: true,
    }
  },

  async fetch() {
    let keyOptions = [];

    const normanType = this.$store.getters['plugins/credentialFieldForDriver'](this.driverName);
    const configId = `${ normanType }credentialconfig`;

    this.normanSchema = await this.$store.dispatch('rancher/find', {
      type: SCHEMA, id: configId, opt: { url: `/v3/schemas/${ configId }` }
    });

    if ( this.normanSchema?.resourceFields ) {
      keyOptions = Object.keys(this.normanSchema.resourceFields);
    } else {
      keyOptions = await this.$store.getters['plugins/fieldNamesForDriver'](this.driverName);
    }

    this.keyOptions = keyOptions;

    const keys = [];

    for ( const k of keyOptions ) {
      const sk = simplify(k);

      if ( this.normanSchema?.resourceFields || likelyFields.includes(sk) || iffyFields.includes(sk) ) {
        keys.push(k);
      }
    }

    for ( const k of keys ) {
      if ( !this.value.decodedData[k] ) {
        this.value.setData(k, '');
      }
    }
  },

  data() {
    return {
      errors:       null,
      normanSchema: null,
    };
  },

  watch: {
    'value.decodedData'(neu) {
      this.$emit('validationChanged', !!neu);
    }
  },

  methods: {
    update(val) {
      this.value.setData(val);
    }
  },

  computed: {
    hasSupport() {
      return !!this.normanSchema;
    }
  }

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Banner
      v-if="!hasSupport"
      color="info"
      label-key="cluster.selectCredential.genericDescription"
      class="mt-0"
    />
    <KeyValue
      :value="value.decodedData"
      :key-options="hasSupport || !keyOptions.length ? null : keyOptions"
      :key-editable="!hasSupport"
      :mode="mode"
      :read-allowed="true"
      :add-allowed="!hasSupport"
      :remove-allowed="!hasSupport"
      :initial-empty-row="true"
      @update:value="update"
    />
  </div>
</template>
