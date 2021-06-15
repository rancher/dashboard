<script>
import CreateEditView from '@/mixins/create-edit-view';
import KeyValue from '@/components/form/KeyValue';
import Banner from '@/components/Banner';
import { _CREATE } from '@/config/query-params';
import { simplify, iffyFields, likelyFields } from '@/store/plugins';

export default {
  components: { KeyValue, Banner },
  mixins:     [CreateEditView],

  props: {
    driverName: {
      type:     String,
      required: true,
    }
  },

  data() {
    const keyOptions = this.$store.getters['plugins/fieldNamesForDriver'](this.driverName);

    if ( this.mode === _CREATE ) {
      // Prepopulate empty values for keys that sound like they're cloud-credential-ey

      const keys = [];

      for ( const k of keyOptions ) {
        const sk = simplify(k);

        if ( likelyFields.includes(sk) || iffyFields.includes(sk) ) {
          keys.push(k);
        }
      }

      for ( const k of keys ) {
        if ( !this.value.decodedData[k] ) {
          this.value.setData(k, '');
        }
      }
    }

    return {
      keyOptions,
      errors: null,
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
  <div>
    <Banner color="info" label-key="cluster.selectCredential.genericDescription" class="mt-0" />
    <KeyValue
      :value="value.decodedData"
      :key-options="keyOptions"
      :mode="mode"
      :read-allowed="true"
      :initial-empty-row="true"
      @input="update"
    />
  </div>
</template>
