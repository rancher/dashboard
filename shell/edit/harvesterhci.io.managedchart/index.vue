<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import Setting from '@shell/edit/harvesterhci.io.setting';

export default {
  name:       'EditManagedChart',
  components: { Setting },
  mixins:     [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    }
  },
};
</script>

<template>
  <Setting
    :initial-value="initialValue"
    :live-value="liveValue"
    :value="value"
  />
</template>
