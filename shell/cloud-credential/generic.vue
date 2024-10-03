<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import KeyValue from '@shell/components/form/KeyValue';
import { Banner } from '@components/Banner';
import { simplify, iffyFields, likelyFields } from '@shell/store/plugins';
import Loading from '@shell/components/Loading';

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

    const { normanSchema } = this;

    if ( normanSchema?.resourceFields ) {
      keyOptions = Object.keys(normanSchema.resourceFields);
    } else {
      keyOptions = await this.$store.getters['plugins/fieldNamesForDriver'](this.driverName);
    }

    this.keyOptions = keyOptions;

    const keys = [];

    for ( const k of keyOptions ) {
      const sk = simplify(k);

      if ( normanSchema?.resourceFields || likelyFields.includes(sk) || iffyFields.includes(sk) ) {
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
    const normanType = this.$store.getters['plugins/credentialFieldForDriver'](this.driverName);
    const normanSchema = this.$store.getters['rancher/schemaFor'](`${ normanType }credentialconfig`);

    return {
      hasSupport: !!normanSchema,
      errors:     null,
      normanSchema,
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
