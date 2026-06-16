<script lang="ts">
import Tab from '@shell/components/Tabbed/Tab.vue';
import DetailText from '@shell/components/DetailText.vue';

export interface Props {
  knownHosts: string;
  weight?: number;
}
</script>

<script lang="ts" setup>
const { knownHosts, weight } = defineProps<Props>();
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
