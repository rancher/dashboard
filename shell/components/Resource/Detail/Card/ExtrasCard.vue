<script lang="ts">
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import { BLANK_CLUSTER } from '@shell/store/store-types';
</script>
<script setup lang="ts">
const store = useStore();
const i18n = useI18n(store);

const extensionsLink = {
  name:   'c-cluster-uiplugins',
  params: { cluster: BLANK_CLUSTER }
};

const clusterToolsLink = {
  name:   'c-cluster-apps-charts',
  params: { cluster: BLANK_CLUSTER }
};
</script>

<template>
  <Card :title="i18n.t('component.resource.detail.card.extrasCard.title')">
    <p class="message">
      {{ i18n.t('component.resource.detail.card.extrasCard.message.prefix') }}
      <router-link :to="extensionsLink">
        {{ i18n.t('component.resource.detail.card.extrasCard.message.extensions') }}
      </router-link>
      {{ i18n.t('component.resource.detail.card.extrasCard.message.conjunction') }}
      <router-link :to="clusterToolsLink">
        {{ i18n.t('component.resource.detail.card.extrasCard.message.clusterTools') }}
      </router-link>
      {{ i18n.t('component.resource.detail.card.extrasCard.message.suffix') }}
    </p>
  </Card>
</template>

<style lang="scss" scoped>
.message {
  margin: 0;
  line-height: 1.5;

  a {
    text-decoration: underline;
  }
}
</style>
