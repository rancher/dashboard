<script>
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import KeyValue from '@shell/components/form/KeyValue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { set } from '@shell/utils/object';

export default {
  components: {
    ArrayListGrouped, KeyValue, LabeledInput
  },

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
        rewrite:   mirrorMap[hostname].rewrite || {},
      });
    }

    return { entries };
  },

  created() {
    if (!this.value.spec.rkeConfig?.registries?.mirrors) {
      set(this.value, 'spec.rkeConfig.registries.mirrors', {});
    }
  },

  computed: {
    defaultAddValue() {
      return {
        hostname:  '',
        endpoints: '',
        rewrite:   {}
      };
    },
  },

  methods: {
    update(entries) {
      const mirrors = {};

      for ( const entry of entries ) {
        if ( !entry.hostname || mirrors[entry.hostname] ) {
          continue;
        }

        mirrors[entry.hostname] = { endpoint: entry.endpoints.split(/\s*,\s*/).map((x) => x.trim()) };
        if (entry.rewrite) {
          mirrors[entry.hostname].rewrite = entry.rewrite;
        }
      }
      set(this.value, 'spec.rkeConfig.registries.mirrors', mirrors);
    },
  }
};
</script>

<template>
  <div>
    <h3>
      {{ t('registryMirror.header') }}
      <i
        v-clean-tooltip="t('registryMirror.toolTip')"
        class="icon icon-info"
      />
    </h3>
    <p class="mb-20">
      {{ t('registryMirror.description') }}
    </p>
    <ArrayListGrouped
      v-model:value="entries"
      :add-label="t('registryMirror.addLabel')"
      :default-add-value="defaultAddValue"
      :initial-empty-row="true"
      :mode="mode"
      @update:value="update"
    >
      <template #default="{row}">
        <div class="row">
          <div class="col span-6">
            <LabeledInput
              v-model:value="row.value.hostname"
              :label="t('registryMirror.hostnameLabel')"
              :placeholder="t('registryMirror.hostnamePlaceholder')"
              :mode="mode"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model:value="row.value.endpoints"
              :label="t('registryMirror.endpointsLabel')"
              :placeholder="t('registryMirror.endpointsPlaceholder')"
              :mode="mode"
            />
          </div>
        </div>
        <div class="row mt-20">
          <div class="col span-12">
            <h3>
              {{ t('registryMirrorRewrite.header') }}
              <i
                v-clean-tooltip="t('registryMirrorRewrite.toolTip')"
                class="icon icon-info"
              />
            </h3>
            <KeyValue
              v-model:value="row.value.rewrite"
              :mode="mode"
              :add-label="t('registryMirrorRewrite.addLabel')"
              :read-allowed="false"
              :key-label="t('registryMirrorRewrite.keyLabel')"
              :key-placeholder="t('registryMirrorRewrite.keyPlaceholder')"
              :value-label="t('registryMirrorRewrite.valueLabel')"
              :value-placeholder="t('registryMirrorRewrite.valuePlaceholder')"
            />
          </div>
        </div>
      </template>
    </ArrayListGrouped>
  </div>
</template>
