<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'MetricsTraitTab',
  components: {
    LabeledInput,
    LabeledSelect,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:    String,
      default: 'create'
    },
    namespacedObject: {
      type:     Object,
      required: true
    },
    tabName: {
      type:     String,
      required: true,
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    return {
      fetchInProgress: true,
      namespace:       this.namespacedObject.metadata.namespace,
      allSecrets:      {},
      secrets:         [],
      deploymentNames: [],
      treeTabName:     this.tabName,
      treeTabLabel:    this.tabLabel,
    };
  },
  async fetch() {
    const requests = {};

    if ( this.$store.getters['cluster/schemaFor'](SECRET) ) {
      requests.secrets = this.$store.dispatch('management/findAll', { type: SECRET });
    }
    if ( this.$store.getters['cluster/schemaFor']('deployment') ) {
      requests.deployments = this.$store.dispatch('management/findAll', { type: 'deployment' });
    }

    const hash = await allHash(requests);

    if (hash.secrets) {
      this.sortObjectsByNamespace(hash.secrets, this.allSecrets);
    }
    if (hash.deployments) {
      this.deploymentNames = hash.deployments.map((deployment) => {
        return `${ deployment.metadata.namespace }/${ deployment.metadata.name }`;
      });
    }
    this.fetchInProgress = false;
  },
  methods: {
    resetSecrets() {
      this.secrets = this.allSecrets[this.namespace] || [];
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.metricsTrait');
    }
  },
  watch: {
    fetchInProgress() {
      this.resetSecrets();
    },
    'value.metadata.namespace'(neu, old) {
      this.namespace = neu;
      this.resetSecrets();
    },
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :button-label="t('verrazzano.common.messages.removeTypeFromComponent', { type: 'MetricsTrait' })"
        :mode="mode"
        @click="$emit('deleteTrait', 'MetricsTrait')"
      />
    </template>
    <template #default>
      <div>
        <div class="row">
          <div class="col span-4">
            <LabeledInput
              :value="getField('trait.kind')"
              :mode="mode"
              disabled
              :label="t('verrazzano.common.fields.kind')"
              @input="setFieldIfNotEmpty('trait.kind', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('trait.spec.port')"
              :mode="mode"
              type="Number"
              :min="minPortNumber"
              :max="maxPortNumber"
              :placeholder="getNotSetPlaceholder(value, 'trait.spec.port')"
              :label="t('verrazzano.common.fields.httpPort')"
              @input="setNumberField('trait.spec.port', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('trait.spec.path')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'trait.spec.path')"
              :label="t('verrazzano.common.fields.httpPath')"
              @input="setFieldIfNotEmpty('trait.spec.path', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-4">
            <LabeledSelect
              :value="getField('trait.spec.secret')"
              :mode="mode"
              :options="secrets"
              option-label="metadata.name"
              :reduce="secret => secret.metadata.name"
              :placeholder="getNotSetPlaceholder(value, 'trait.spec.secret')"
              :label="t('verrazzano.common.fields.metricsSecret')"
              @input="setFieldIfNotEmpty('trait.spec.secret', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledSelect
              :value="getField('trait.spec.scraper')"
              :mode="mode"
              :options="deploymentNames"
              :placeholder="getNotSetPlaceholder(value, 'trait.spec.scraper')"
              :label="t('verrazzano.common.fields.scraper')"
              @input="setFieldIfNotEmpty('trait.spec.scraper', $event)"
            />
          </div>
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
