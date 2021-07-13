<script>
import Setting from '@/edit/harvesterhci.io.setting';

export default {
  name:       'EditClusterNetwork',
  components: { Setting },

  props: {
    value: {
      type:     Object,
      required: true,
    }
  },
};
</script>

<template>
  <Setting :value="value" />
</template>
