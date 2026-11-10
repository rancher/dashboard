<script lang="ts">
import SpacedRow from '@shell/components/Resource/Detail/SpacedRow.vue';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import ExtrasCard from '@shell/components/Resource/Detail/Card/ExtrasCard.vue';
import { useExtensionCards } from '@shell/composables/useExtensionCards';
import { useI18n } from '@shell/composables/useI18n';
import { Card as ExtensionCard, CardLocation } from '@shell/core/types';
import { computed } from 'vue';
import { useStore } from 'vuex';

export interface Props {
  resource: any;
  /**
   * Show the cards the resource itself provides. Extension cards are shown either way - a page
   * without the resource's own cards can still be a page an extension wants to add a card to
   */
  showResourceCards?: boolean;
}
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<Props>(), { showResourceCards: true });

const i18n = useI18n(useStore());

const resourceCards = computed(() => {
  if (!props.showResourceCards) {
    return [];
  }

  return (props.resource?.cards || []).filter((card: any) => !!card);
});
const extensionCards = useExtensionCards(CardLocation.RESOURCE_DETAIL_CARD);

const total = computed(() => resourceCards.value.length + extensionCards.value.length);
const showExtrasCard = computed(() => total.value >= 1 && total.value < 3);

const titleFor = (card: ExtensionCard) => card.labelKey ? i18n.t(card.labelKey) : card.label;
</script>

<template>
  <SpacedRow v-if="total > 0">
    <component
      :is="card.component"
      v-for="(card, i) in resourceCards"
      :key="i"
      v-bind="card.props"
    />
    <Card
      v-for="(card, i) in extensionCards"
      :key="`extension-card-${i}`"
      :title="titleFor(card)"
    >
      <component
        :is="card.component"
        :resource="resource"
      />
    </Card>
    <ExtrasCard v-if="showExtrasCard" />
  </SpacedRow>
</template>
