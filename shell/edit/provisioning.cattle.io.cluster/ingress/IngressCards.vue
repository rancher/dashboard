<script setup lang="ts">
import { _CREATE } from '@shell/config/query-params';
import { PropType } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { RcItemCard, RcItemCardAction } from '@components/RcItemCard';
import { RcButton } from '@components/RcButton';

interface IngressCard {
  id: string;
  image?: any;
  header: { title: { key: string } };
  subHeader: { label: { key: string } };
  content: { key: string };
  doc: {url: string};
  selected?: false;
}

defineProps({
  options: {
    type:     Array as PropType<IngressCard[]>,
    mode:     _CREATE,
    required: true
  }
});

const emit = defineEmits(['select', 'load-more']);

const store = useStore();
const { t } = useI18n(store);

function onLearnMore(doc: any) {
  if (doc?.url) {
    window.open(doc.url, '_blank');
  }
}

</script>

<template>
  <div class="ingress-cards">
    <rc-item-card
      v-for="card in options"
      :id="card.id"
      :key="card.id"
      :header="card.header"
      :image="card.image"
      :content="card.content"
      :selected="card.selected"
      variant="small"
      role="link"
      :class="{ 'single-card': options.length === 1 }"
      :clickable="true"
      @card-click="emit('select', card.id)"
    >
      <template
        v-once
        #item-card-sub-header
      >
        <p class="ingress-card-sub-header">
          {{ t(card.subHeader.label.key) }}
        </p>
      </template>
      <template
        v-if="!!card.doc"
        v-once
        #item-card-footer
      >
        <rc-item-card-action>
          <rc-button
            variant="ghost"
            class="ingress-card-footer-button secondary-text-link"
            :aria-label="t('cluster.ingress.learnMore.ariaLabel')"
            @click="onLearnMore(card.doc)"
          >
            {{ t('cluster.ingress.learnMore') }}
          </rc-button>
        </rc-item-card-action>
      </template>
    </rc-item-card>
  </div>
</template>

<style scoped lang="scss">
.ingress-cards{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: var(--gap-md);
  width: 100%;
  height: max-content;
  overflow: hidden;

  .single-card {
    max-width: 500px;
  }
}
.ingress-card-sub-header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap) var(--gap-md);
  color: var(--link-text-secondary);
  margin-bottom: 8px;
}

button.variant-ghost.ingress-card-footer-button {
  padding: 0;
  gap: 0;
  min-height: 20px;

  &:focus-visible {
    border-color: var(--primary);
    @include focus-outline;
    outline-offset: -2px;
  }
}
</style>
