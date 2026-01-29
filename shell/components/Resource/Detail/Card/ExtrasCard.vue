<script lang="ts">
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import { BLANK_CLUSTER } from '@shell/store/store-types';
</script>
<script setup lang="ts">
import { useRouter } from 'vue-router';

const store = useStore();
const router = useRouter();
const i18n = useI18n(store);

const extensionsUrl = router.resolve({
  name:   'c-cluster-uiplugins',
  params: { cluster: BLANK_CLUSTER }
}).href;

const clusterToolsUrl = router.resolve({
  name:   'c-cluster-apps-charts',
  params: { cluster: BLANK_CLUSTER }
}).href;
</script>

<template>
  <Card :title="i18n.t('component.resource.detail.card.extrasCard.title')">
    <p
      v-clean-html="i18n.t('component.resource.detail.card.extrasCard.message', { extensionsUrl, clusterToolsUrl }, true)"
      class="message text-deemphasized"
    />
  </Card>
</template>

<style lang="scss" scoped>
.message {
  margin: 0;
  line-height: 1.5;
}
</style>
