<script setup lang="ts">
import { computed, ref } from 'vue';
import { Card } from '@components/Card';
import { RcButton } from '@components/RcButton';
import { RcTag } from '@components/Pill';
import { RcItemCard } from '@components/RcItemCard';
import AuthProviderLogo from '@shell/components/auth/AuthProviderLogo.vue';

interface ProviderType {
  id: string;
  provider: string;
  sideLabel: string;
  configType: string;
  icon: string;
}

const props = defineProps<{
  rows: ProviderType[];
  selectCb:(id: string) => void;
}>();

const emit = defineEmits<{(e: 'close'): void }>();

const search = ref('');
const protocol = ref('');

const protocols = computed(() => {
  return Array.from(new Set(props.rows.map((row) => row.configType).filter(Boolean))).sort();
});

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();

  return props.rows.filter((row) => {
    const matchesProtocol = !protocol.value || row.configType === protocol.value;
    const matchesTerm = !term || row.provider.toLowerCase().includes(term);

    return matchesProtocol && matchesTerm;
  });
});

const select = (id: string) => {
  props.selectCb(id);
  emit('close');
};
</script>

<template>
  <Card
    class="add-auth-provider"
    :show-highlight-border="false"
  >
    <template #title>
      <h4 class="text-default-text">
        {{ t('authConfig.add.title') }}
      </h4>
    </template>

    <template #body>
      <div class="add-auth-provider__body">
        <p class="add-auth-provider__subtitle">
          {{ t('authConfig.add.subtitle') }}
        </p>

        <input
          v-model="search"
          type="search"
          class="add-auth-provider__search"
          :placeholder="t('authConfig.add.searchPlaceholder')"
          :aria-label="t('authConfig.add.searchPlaceholder')"
          data-testid="add-auth-provider-search"
        >

        <div class="add-auth-provider__filters">
          <span class="add-auth-provider__filter-label">{{ t('authConfig.add.filterLabel') }}</span>
          <RcTag
            :type="protocol === '' ? 'active' : 'inactive'"
            class="add-auth-provider__filter"
            role="button"
            tabindex="0"
            data-testid="add-auth-provider-filter-all"
            @click="protocol = ''"
            @keydown.enter="protocol = ''"
            @keydown.space.prevent="protocol = ''"
          >
            {{ t('authConfig.add.filterAll') }}
          </RcTag>
          <RcTag
            v-for="option in protocols"
            :key="option"
            :type="protocol === option ? 'active' : 'inactive'"
            class="add-auth-provider__filter"
            role="button"
            tabindex="0"
            :data-testid="`add-auth-provider-filter-${ option }`"
            @click="protocol = option"
            @keydown.enter="protocol = option"
            @keydown.space.prevent="protocol = option"
          >
            {{ option.toUpperCase() }}
          </RcTag>
        </div>

        <ul
          v-if="filtered.length"
          class="add-auth-provider__grid"
        >
          <li
            v-for="row in filtered"
            :key="row.id"
          >
            <rc-item-card
              :id="row.id"
              :value="row"
              :header="{ title: { text: row.provider } }"
              variant="medium"
              :clickable="true"
              class="add-auth-provider__tile"
              :data-testid="`add-auth-provider-tile-${ row.id }`"
              @card-click="select(row.id)"
            >
              <template #item-card-image>
                <AuthProviderLogo :icon="row.icon" />
              </template>
              <template #item-card-sub-header>
                <RcTag
                  type="inactive"
                  :data-testid="`add-auth-provider-tile-protocol-${ row.id }`"
                >
                  {{ row.sideLabel }}
                </RcTag>
              </template>
            </rc-item-card>
          </li>
        </ul>
        <p
          v-else
          class="add-auth-provider__empty"
          data-testid="add-auth-provider-no-results"
        >
          {{ t('authConfig.add.noResults') }}
        </p>
      </div>
    </template>

    <template #actions>
      <div class="add-auth-provider__actions">
        <rc-button
          variant="link"
          @click="emit('close')"
        >
          {{ t('generic.cancel') }}
        </rc-button>
      </div>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
// How far a focus ring reaches beyond the element it belongs to (offset + width)
$tile-focus-ring: 4px;

.add-auth-provider {
  &.card-container {
    box-shadow: none;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__subtitle {
    margin: 0;
    color: var(--label-secondary);
  }

  &__search {
    width: 100%;
  }

  &__filters {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__filter-label {
    color: var(--label-secondary);
    font-size: 12px;
    line-height: 18px;
  }

  &__filter {
    cursor: pointer;

    &:focus-visible {
      @include focus-outline;
      outline-offset: 2px;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;

    // A scrolling box clips at its padding edge, which would cut the ring off an
    // edge tile - the padding gives the ring room, and the margin takes it back
    // out so the tiles still line up with the search field above them.
    margin: -$tile-focus-ring;
    padding: $tile-focus-ring;
    list-style: none;
    max-height: 400px;
    overflow-y: auto;

    // The list scrolls, so browsers make it focusable in its own right - give it
    // the same ring as anything else you can tab to, rather than the default one.
    border-radius: var(--border-radius-lg);

    &:focus-visible {
      @include focus-outline;
      outline-offset: 2px;
    }
  }

  &__tile {
    // The card stacks title and sub-header with its default 8px rhythm; the
    // design pairs them tighter as a single label block.
    :deep(.item-card-body-details) {
      gap: 4px;
    }
  }

  &__empty {
    margin: 0;
    padding: 24px 0;
    color: var(--label-secondary);
    text-align: center;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }
}
</style>
