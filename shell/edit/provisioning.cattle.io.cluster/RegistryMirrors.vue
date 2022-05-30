<script>
import KeyValue from '@shell/components/form/KeyValue';
import { set } from '@shell/utils/object';

export default {
  components: { KeyValue },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    const mirrorMap = this.value.spec.rkeConfig?.registries?.mirrors || {};
    const entries = [];

    for ( const hostname in mirrorMap ) {
      entries.push({
        hostname,
        endpoints: (mirrorMap[hostname].endpoint || []).join(', '),
      });
    }

    return { entries };
  },

  methods: {
    update(entries) {
      const mirrors = {};

      for ( const entry of entries ) {
        if ( !entry.hostname || mirrors[entry.hostname] ) {
          continue;
        }

        mirrors[entry.hostname] = { endpoint: entry.endpoints.split(/\s*,\s*/).map(x => x.trim()) };
      }

      set(this.value, 'spec.rkeConfig.registries.mirrors', mirrors);
    },
  }
};
</script>

<template>
  <KeyValue
    key="labels"
    :value="entries"
    :as-map="false"
    key-label="Registry Hostname"
    key-name="hostname"
    key-placeholder="e.g. docker.io or *"
    value-label="Mirror Endpoints"
    value-placeholder="e.g. a.registry.com:5000, b.registry.com:5000"
    value-name="endpoints"
    :add-label="t('registryMirror.addLabel')"
    :mode="mode"
    :read-allowed="false"
    @input="update"
  >
    <template #title>
      <h3>
        {{ t('registryMirror.header') }}
        <i v-tooltip="t('registryMirror.toolTip')" class="icon icon-info" />
      </h3>
    </template>
  </KeyValue>
</template>
