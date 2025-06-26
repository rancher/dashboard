<script lang="ts">
import DetailText from '@shell/components/DetailText.vue';

export interface Props {
    crt?: string;
    token?: string;
}
</script>

<script setup lang="ts">
const props = defineProps<Props>();
</script>

<template>
  <div class="row secret-data-certificate">
    <div class="col span-6 token">
      <DetailText
        :value="props.token"
        label-key="secret.certificate.privateKey"
        :conceal="true"
        :conceal-stand-alone="true"
      />
    </div>
    <div class="col span-6 crt">
      <DetailText
        :value="props.crt"
        label-key="secret.certificate.certificate"
      />
    </div>
  </div>
</template>
