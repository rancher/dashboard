<script lang="ts">
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import { BLANK_CLUSTER } from '@shell/store/store-types';
import { isAdminUser } from '@shell/store/type-map';
import { DOCS_BASE } from '@shell/config/private-label';
</script>
<script setup lang="ts">
import RichTranslation from '@shell/components/RichTranslation.vue';
import { computed } from 'vue';

const store = useStore();
const i18n = useI18n(store);
const isAdmin = computed(() => isAdminUser(store.getters));

const extensionsRoute = { name: 'c-cluster-uiplugins', params: { cluster: BLANK_CLUSTER } };
const extensionsDocsUrl = `${ DOCS_BASE }/integrations-in-rancher/rancher-extensions`;

const clusterToolsRoute = { name: 'c-cluster-explorer-tools' };
const clusterToolsDocsUrl = `${ DOCS_BASE }/reference-guides/rancher-cluster-tools`;
</script>

<template>
  <Card :title="i18n.t('component.resource.detail.card.extrasCard.title')">
    <p class="message text-deemphasized">
      <RichTranslation k="component.resource.detail.card.extrasCard.message">
        <template #extensionsLink="{ content }">
          <router-link
            v-if="isAdmin"
            class="secondary text-deemphasized"
            :to="extensionsRoute"
          >
            {{ content }}
          </router-link>
          <a
            v-else
            class="secondary text-deemphasized"
            :href="extensionsDocsUrl"
            target="_blank"
          >
            {{ content }}
          </a>
        </template>
        <template #clusterToolsLink="{ content }">
          <router-link
            v-if="isAdmin"
            class="secondary-text-link"
            :to="clusterToolsRoute"
          >
            {{ content }}
          </router-link>
          <a
            v-else
            class="secondary-text-link"
            :href="clusterToolsDocsUrl"
            target="_blank"
          >
            {{ content }}
          </a>
        </template>
      </RichTranslation>
    </p>
  </Card>
</template>

<style lang="scss" scoped>
.message {
  margin: 0;
  margin-top: -2px;
  line-height: 20px;
}
</style>
