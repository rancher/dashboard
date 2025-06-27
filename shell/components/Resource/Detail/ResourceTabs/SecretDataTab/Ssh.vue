<script lang="ts">
import DetailText from '@shell/components/DetailText.vue';

export interface Props {
    username: string;
    password: string;
}
</script>

<script setup lang="ts">
const props = defineProps<Props>();

</script>

<template>
  <div class="row secret-data-ssh">
    <div class="col span-6 username">
      <DetailText
        :value="props.username"
        label-key="secret.ssh.public"
      />
    </div>
    <div class="col span-6 password">
      <DetailText
        :value="props.password"
        label-key="secret.ssh.private"
        :conceal="true"
        :conceal-stand-alone="true"
      />
    </div>
  </div>
</template>
