<script setup lang="ts">
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { PropType } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { RcItemCard, RcItemCardAction } from '@components/RcItemCard';

interface IngressCard {
  id: string;
  image?: any;
  header: { title: { key: string } };
  subHeader: { label: { key: string } };
  content: { key: string };
  doc?: {url: string};
  selected?: boolean;
}

defineProps({
  options: {
    type:     Array as PropType<IngressCard[]>,
    required: true
  },
  mode: { type: String, default: _CREATE },
});

const emit = defineEmits(['select']);

const store = useStore();
const { t } = useI18n(store);

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
      :clickable="mode !== _VIEW"
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
          <a
            :href="card.doc.url"
            rel="nofollow noopener noreferrer"
            target="_blank"
            class="ingress-card-footer-button secondary-text-link"
          >
            {{ t('cluster.ingress.learnMore.label') }}
            <i class="icon icon-external-link" />
            <span class="sr-only">{{ t('generic.opensInNewTab') }}</span>
          </a>
        </rc-item-card-action>
      </template>
    </rc-item-card>
  </div>
</template>

<style scoped lang="scss">
.ingress-cards{
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
