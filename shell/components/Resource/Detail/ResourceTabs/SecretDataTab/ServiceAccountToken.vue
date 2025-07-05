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
  <div class="row secret-data-service-account-token">
    <div class="col span-6 crt">
      <DetailText
        :value="props.crt"
        label-key="secret.serviceAcct.ca"
      />
    </div>
    <div class="col span-6 token">
      <DetailText
        :value="props.token"
        label-key="secret.serviceAcct.token"
        :conceal="true"
        :conceal-stand-alone="true"
      />
    </div>
  </div>
</template>
