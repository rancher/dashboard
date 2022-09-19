<script>
// Added by Verrazzano
import ConfigMap from '@pkg/components/VolumesTab/ConfigMap';
import DownwardAPI from '@pkg/components/VolumesTab/DownwardAPI';
import Secret from '@pkg/components/VolumesTab/Secret';
import ServiceAccountToken from '@pkg/components/VolumesTab/ProjectedVolume/ServiceAccountToken';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'ProjectionSource',
  components: {
    ConfigMap,
    DownwardAPI,
    LabeledSelect,
    Secret,
    ServiceAccountToken,
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
    namespacedObject: {
      type:     Object,
      required: true
    },
  },
  data() {
    let projectionType = '';
    const sourceKeys = Object.keys(this.value).filter(key => key !== '_id');

    if (Array.isArray(sourceKeys) && sourceKeys.length > 0) {
      projectionType = sourceKeys[0];
    }

    return { projectionType };
  },
  computed: {
    projectionTypes() {
      return [
        { value: 'configMap', label: this.t('verrazzano.common.types.projected.configMap') },
        { value: 'downwardAPI', label: this.t('verrazzano.common.types.projected.downwardApi') },
        { value: 'secret', label: this.t('verrazzano.common.types.projected.secret') },
        { value: 'serviceAccountToken', label: this.t('verrazzano.common.types.projected.serviceAccountToken') },
      ];
    },
    showConfigMap() {
      return this.projectionType === 'configMap';
    },
    showDownwardAPI() {
      return this.projectionType === 'downwardAPI';
    },
    showSecret() {
      return this.projectionType === 'secret';
    },
    showServiceAccountToken() {
      return this.projectionType === 'serviceAccountToken';
    },
  },
  methods: {
    setProjectionType(value) {
      this.projectionType = value;
    },
  },
  watch: {
    projectionType(neu, old) {
      if (old) {
        this.setField(old, undefined);
      }
    },
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model="projectionType"
          :mode="mode"
          required
          :options="projectionTypes"
          option-key="value"
          option-label="label"
          :label="t('verrazzano.common.fields.volumes.projected.sourceType')"
          @input="setProjectionType($event)"
        />
      </div>
    </div>
    <div v-if="showConfigMap">
      <div class="spacer-small" />
      <h4>{{ t('verrazzano.common.titles.volumes.projected.configMap') }}</h4>
      <ConfigMap
        :value="getField('configMap')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :show-default-mode="false"
        @input="setFieldIfNotEmpty('configMap', $event)"
      />
    </div>
    <div v-else-if="showDownwardAPI">
      <div class="spacer-small" />
      <h4>{{ t('verrazzano.common.titles.volumes.projected.downwardApi') }}</h4>
      <DownwardAPI
        :value="getField('downwardAPI')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :show-default-mode="false"
        @input="setFieldIfNotEmpty('downwardAPI', $event)"
      />
    </div>
    <div v-else-if="showSecret">
      <div class="spacer-small" />
      <h4>{{ t('verrazzano.common.titles.volumes.projected.secret') }}</h4>
      <Secret
        :value="getField('secret')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :show-default-mode="false"
        @input="setFieldIfNotEmpty('secret', $event)"
      />
    </div>
    <div v-else-if="showServiceAccountToken">
      <div class="spacer-small" />
      <h4>{{ t('verrazzano.common.titles.volumes.projected.serviceAccountToken') }}</h4>
      <ServiceAccountToken
        :value="getField('serviceAccountToken')"
        :mode="mode"
        @input="setFieldIfNotEmpty('serviceAccountToken', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
