<script>
import YamlEditor from '@shell/components/YamlEditor';
import Question from './Question';
import { _VIEW } from '@shell/config/query-params';

export default {
  emits: ['update:value'],

  components: { YamlEditor },
  mixins:     [Question],
  data() {
    return { VIEW: _VIEW };
  }
};
</script>

<template>
  <div
    :data-testid="`yaml-row-${question.variable}`"
    class="row"
  >
    <div class="col span-6">
      <h3>
        {{ displayLabel }}
        <i
          v-if="displayTooltip"
          v-clean-tooltip="displayTooltip"
          class="icon icon-info icon-lg"
        />
      </h3>
      <YamlEditor
        class="yaml-editor mb-6"
        :editor-mode="mode === VIEW ? 'VIEW_CODE' : 'EDIT_CODE'"
        :disabled="disabled"
        :value="value"
        :data-testid="`yaml-input-${question.variable}`"
        @update:value="$emit('update:value', $event)"
      />
    </div>
    <div
      v-if="showDescription"
      :data-testid="`yaml-description-${question.variable}`"
      class="col span-6 mt-10"
    >
      {{ displayDescription }}
    </div>
  </div>
</template>
