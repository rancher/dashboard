<script>
// Added by Verrazzano
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import PodDNSConfigOptions from '@pkg/components/PodSpecTab/PodDNSConfigOptions';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'PodDNSConfig',
  components: {
    LabeledArrayList,
    PodDNSConfigOptions,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <LabeledArrayList
          :value="getListField('nameservers')"
          :mode="mode"
          :value-label="t('verrazzano.common.fields.dnsNameserver')"
          :add-label="t('verrazzano.common.buttons.addDNSNameserver')"
          @input="setFieldIfNotEmpty('nameservers', $event)"
        />
      </div>
      <div class="col span-6">
        <LabeledArrayList
          :value="getListField('searches')"
          :mode="mode"
          :value-label="t('verrazzano.common.fields.dnsSearchDomain')"
          :add-label="t('verrazzano.common.buttons.addDNSSearchDomain')"
          @input="setFieldIfNotEmpty('searches', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div>
      <h4>{{ t('verrazzano.common.titles.dnsResolverOptions') }}</h4>
      <PodDNSConfigOptions
        v-model="value"
        :mode="mode"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
