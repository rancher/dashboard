<script>
import { CAPI } from '@/config/labels-annotations';

export default {
  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:     String,
      required: true,
    }
  },

  data() {
    const driver = this.value.metadata.annotations?.[CAPI.CREDENTIAL_DRIVER];

    return { driver };
  },
};
</script>

<template>
  <div>Cloud -{{ driver }}-</div>
</template>
