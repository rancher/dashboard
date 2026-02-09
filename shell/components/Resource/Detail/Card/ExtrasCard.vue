<script lang="ts">
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import { BLANK_CLUSTER } from '@shell/store/store-types';
import { isAdminUser } from '@shell/store/type-map';
import { DOCS_BASE } from '@shell/config/private-label';
</script>
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { computed } from 'vue';

const store = useStore();
const router = useRouter();
const i18n = useI18n(store);
const isAdmin = computed(() => isAdminUser(store.getters));

const extensionsUrl = computed(() => {
  const pageUrl = router.resolve({
    name:   'c-cluster-uiplugins',
    params: { cluster: BLANK_CLUSTER }
  }).href;
  const docsUrl = `${ DOCS_BASE }/integrations-in-rancher/rancher-extensions`;

  return isAdmin.value ? pageUrl : docsUrl;
});

const clusterToolsUrl = computed(() => {
  const pageUrl = router.resolve({ name: 'c-cluster-explorer-tools' }).href;
  const docsUrl = `${ DOCS_BASE }/reference-guides/rancher-cluster-tools`;

  return isAdmin.value ? pageUrl : docsUrl;
});

const linkTarget = computed(() => isAdmin.value ? '_self' : '_blank');
</script>

<template>
  <Card :title="i18n.t('component.resource.detail.card.extrasCard.title')">
    <p
      v-clean-html="i18n.t('component.resource.detail.card.extrasCard.message', { extensionsUrl, clusterToolsUrl, linkTarget }, true)"
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
