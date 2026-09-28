<script lang="ts" setup>
import CodeMirror from '@shell/components/CodeMirror.vue';
import { _VIEW } from '@shell/config/query-params';
import { nlToBr } from '@shell/utils/string';
import { computed } from 'vue';

export interface Props {
  value: string;
}

const props = defineProps<Props>();

const isEmpty = computed(() => props.value.length === 0);
const jsonStr = computed(() => {
  const value = props.value;

  if ( value && ( value.startsWith('{') || value.startsWith('[') ) ) {
    try {
      let parsed = JSON.parse(value);

      parsed = JSON.stringify(parsed, null, 2);

      return parsed;
    } catch {
    }
  }

  return null;
});

const bodyHtml = computed(() => {
  return nlToBr(props.value);
});

</script>
<template>
  <div class="content">
    <span
      v-if="isEmpty"
      v-t="'detailText.empty'"
    />
    <CodeMirror
      v-else-if="jsonStr"
      :mode="_VIEW"
      :options="{mode:{name:'javascript', json:true}, lineNumbers:false, foldGutter:false}"
      :value="jsonStr"
    />
    <span
      v-else
      v-clean-html="bodyHtml"
      data-testid="detail-top_html"
      :class="{'monospace': true}"
    />
  </div>
</template>

<style lang="scss" scoped>
:deep() {
    .CodeMirror-gutters {
        display: none;
    }
}
</style>
