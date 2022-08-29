<script>
import { allHash } from '@shell/utils/promise';
import { Banner } from '@components/Banner';
import MessageLink from '@shell/components/MessageLink';
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';

import { SCHEMA, MONITORING, MANAGEMENT } from '@shell/config/types';
import { HCI } from '../types';

const schema = {
  id:         HCI.ALERTMANAGERCONFIG,
  type:       SCHEMA,
  attributes: {
    kind:       HCI.ALERTMANAGERCONFIG,
    namespaced: true
  },
  metadata: { name: HCI.ALERTMANAGERCONFIG },
};

export default {
  name:       'ListAlertManagerConfigs',
  components: {
    Banner, Loading, ResourceTable, MessageLink
  },

  async fetch() {
    const _hash = { rows: this.$store.dispatch('harvester/findAll', { type: MONITORING.ALERTMANAGERCONFIG }) };

    if (this.$store.getters['harvester/schemaFor'](MANAGEMENT.MANAGED_CHART)) {
      _hash.monitoring = this.$store.dispatch('harvester/find', { type: MANAGEMENT.MANAGED_CHART, id: 'fleet-local/rancher-monitoring' });
    }

    const hash = await allHash(_hash);

    this.rows = hash.rows;
    this.alertingEnabled = hash.monitoring?.spec?.values?.alertmanager?.enabled;

    const configSchema = this.$store.getters['harvester/schemaFor'](MONITORING.ALERTMANAGERCONFIG);

    this.$store.dispatch('type-map/configureType', { match: HCI.ALERTMANAGERCONFIG, isCreatable: configSchema?.collectionMethods.find(x => x.toLowerCase() === 'post') && this.alertingEnabled });
  },

  data() {
    return { rows: null, alertingEnabled: false };
  },

  computed: {
    schema() {
      return schema;
    },

    to() {
      return `${ HCI.MANAGED_CHART }/fleet-local/rancher-monitoring?mode=edit#alertmanager`;
    },
  },

  typeDisplay() {
    return this.$store.getters['type-map/labelFor'](schema, 99);
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Banner v-if="alertingEnabled === false" color="error">
      <MessageLink
        :to="to"
        prefix-label="harvester.monitoring.alertmanagerConfig.diabledTips.prefix"
        middle-label="harvester.monitoring.alertmanagerConfig.diabledTips.middle"
        suffix-label="harvester.monitoring.alertmanagerConfig.diabledTips.suffix"
      />
    </Banner>
    <Banner color="info">
      {{ t('monitoring.alertmanagerConfig.description') }}
    </Banner>
    <ResourceTable
      v-bind="$attrs"
      :groupable="true"
      :schema="schema"
      :rows="rows"
      key-field="_key"
      v-on="$listeners"
    />
  </div>
</template>

<style lang="scss" scoped>
.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin-top: 6em;
  min-height: 100%;
}

i {
  font-size: 10em;
  opacity: 50%;
  margin: 0;
}

h2 {
  margin: 0;
}

h3 {
  margin-top: 2em;
}

</style>
