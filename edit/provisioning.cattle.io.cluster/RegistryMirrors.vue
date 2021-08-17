<script>
import KeyValue from '@/components/form/KeyValue';
import { set } from '@/utils/object';

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
        endpoints: (mirrorMap[hostname].entries || []).join(', '),
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
    add-label="Add Mirror"
    :mode="mode"
    :read-allowed="false"
    @input="update"
  >
    <template #title>
      <h3>
        Mirrors
        <i v-tooltip="'Mirrors can be used to redirect requests for images from one registry to actually come from a list of endpoints you specify instead.  For example you could point docker.io to always talk to your internal registry and instead of ever going to the actual DockerHub on the internet.'" class="icon icon-info" />
      </h3>
    </template>
  </KeyValue>
</template>
