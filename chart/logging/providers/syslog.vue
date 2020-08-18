<script>
import FileSelector, { createOnSelected } from '@/components/form/FileSelector';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import { enabledDisabled } from './options';

export default {
  components: {
    FileSelector, LabeledInput, LabeledSelect
  },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    return { enabledDisabledOptions: enabledDisabled(this.t.bind(this)) };
  },

  methods: { onRootCaSelected: createOnSelected('values.root_ca') },
};
</script>

<template>
  <div v-if="value.syslog.enabled" class="syslog">
    <LabeledInput v-model="value.syslog.address" :label="t('logging.syslog.address')" />
    <LabeledSelect v-model="value.syslog.cluster" :options="enabledDisabledOptions" :label="t('logging.syslog.cluster')" />
    <div>
      <LabeledInput v-model="value.syslog.root_ca" type="multiline" :label="t('logging.syslog.rootCa.label')" :placeholder="t('logging.syslog.rootCa.placeholder')" />
      <FileSelector class="btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onRootCaSelected" />
    </div>
  </div>
</template>

<style lang="scss">
.syslog {
    & > * {
        margin-top: 10px;
    }
}
</style>
