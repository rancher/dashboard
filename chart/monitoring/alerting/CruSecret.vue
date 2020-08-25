<script>
// import ClickExpand from '@/components/formatter/ClickExpand';
// import CodeMirror from '@/components/CodeMirror';
import KeyValue from '@/components/form/KeyValue.vue';
// import YamlEditor from '@/components/YamlEditor';

export default {
  components: {
    // ClickExpand,
    // CodeMirror,
    KeyValue,
    // YamlEditor
  },
  props:      {
    mode: {
      type:    String,
      default: 'create',
    },

    value: {
      type:    Object,
      default: () => ({})
    },
  },

  data() {
    return {
      codeMirrorOptions: {
        mode:        'yaml',
        lineNumbers: false,
        lint:        false,
        foldGutter:  false,
        readOnly:    true
      }
    };
  },
};
</script>

<template>
  <KeyValue
    v-model="value"
    :mode="mode"
    :initial-empty-row="true"
    :value-multiline="true"
    @input="$emit('set-secret-values', $event)"
  >
    <!-- <template #value="{isView,row,valueName}">
      <div v-if="isView" class="view force-wrap">
        <template v-if="get(row, '_display.parsed')">
          <CodeMirror
            :options="codeMirrorOptions"
            :value="row[valueName]"
          />
        </template>
        <ClickExpand
          v-else-if="get(row, '_display.isLarge')"
          :value="row[valueName]"
          :size="get(row, '_display.byteSize')"
        />
        <span
          v-else-if="get(row, '_display.withBreaks')"
          v-html="get(row, '_display.withBreaks')"
        />
        <span v-else class="text-muted">&mdash;</span>
      </div>
      <YamlEditor
        v-else
        id="alert-manager-config-yaml-entry"
        ref="yaml"
        :scrolling="false"
        :value="row[valueName]"
        @onInput="$emit('secret-yaml-update', $event, row)"
      />
    </template> -->
  </KeyValue>
</template>
