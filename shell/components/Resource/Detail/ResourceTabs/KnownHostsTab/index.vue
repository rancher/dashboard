<script lang="ts">
import Tab from '@shell/components/Tabbed/Tab.vue';
import { computed } from 'vue';
import { base64Decode } from '@shell/utils/crypto';
import DetailText from '@shell/components/DetailText.vue';

export interface Props {
  secret: any;
  weight?: number;
}
</script>

<script lang="ts" setup>
const { secret, weight } = defineProps<Props>();

const knownHosts = computed(() => {
  const { data = {} } = secret;

  return data.known_hosts ? base64Decode(data.known_hosts) : '';
});
</script>

<template>
  <Tab
    name="known_hosts"
    label-key="secret.ssh.knownHosts"
    :weight="weight"
  >
    <div class="row">
      <div class="col span-12">
        <DetailText
          :value="knownHosts"
          label-key="secret.ssh.knownHosts"
          :conceal="false"
        />
      </div>
    </div>
  </Tab>
</template>
