<script>
import { defineComponent } from 'vue';
import { _EDIT } from '@shell/config/query-params';
import { Checkbox } from '@components/Form/Checkbox';
import { mapGetters } from 'vuex';

export default defineComponent({
  name:       'DayTwoOps',
  components: { Checkbox },
  props:      {
    mode: {
      type:    String,
      default: _EDIT
    },
    value: {
      type:    Boolean,
      default: false
    },
    globalSetting: {
      type:     Boolean,
      required: true,
    }
  },
  emits:    ['update:value'],
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    globalConfigurationText() {
      return !this.globalSetting ? this.t('imported.basics.dayTwoOpsEnabled.globallyDisabled', {}, true) : this.t('imported.basics.dayTwoOpsEnabled.globallyEnabled', {}, true);
    }
  },
});
</script>

<template>
  <div class="mt-10">
    <h3 v-t="'imported.basics.dayTwoOpsEnabled.title'" />
    <div class="col">
      <Checkbox
        :value="value"
        :mode="mode"
        :label="t('imported.basics.dayTwoOpsEnabled.label')"
        :tooltip="globalConfigurationText"
        @update:value="$emit('update:value', $event)"
      />
    </div>
  </div>
</template>
