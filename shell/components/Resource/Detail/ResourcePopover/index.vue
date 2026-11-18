<script lang="ts">
import { useFetch } from '@shell/components/Resource/Detail/FetchLoader/composables';
import { useStore } from 'vuex';
import ResourcePopoverCard from '@shell/components/Resource/Detail/ResourcePopover/ResourcePopoverCard.vue';
import RcStatusIndicator from '@components/Pill/RcStatusIndicator/RcStatusIndicator.vue';
import { useI18n } from '@shell/composables/useI18n';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import PopoverCard from '@shell/components/PopoverCard.vue';
import ActionMenu from '@shell/components/ActionMenuShell.vue';

export interface Props {
  type: string;
  id: string;
  currentStore?: string;
  detailLocation?: object;
  /**
   * Text shown before the resource has loaded, or when it can't be loaded. Defaults to the id
   */
  name?: string;
  /**
   * Show the state of the resource as a coloured dot next to the name
   */
  showStatus?: boolean;
  /**
   * Fetch the resource only when the user hovers or focuses it, rather than straight away.
   * Use this where many popovers can be shown at once, e.g. in a table
   */
  lazy?: boolean;
  /**
   * Wrap a long name over lines rather than truncating it, e.g. so it doesn't widen a table column
   */
  wrapName?: boolean;
}
</script>

<script setup lang="ts">
const store = useStore();
const i18n = useI18n(store);
const props = withDefaults(defineProps<Props>(), {
  currentStore: undefined, detailLocation: undefined, name: undefined, showStatus: true, lazy: false, wrapName: false
});
const card = ref<any>(null);
const showPopover = ref<boolean>(false);

const glanceResourcesLoading = ref<boolean>(false);
let glanceResourcesAbort: AbortController | undefined;

// Nothing shows them once the card has closed, so their requests don't need to finish
const cancelGlanceResources = () => {
  glanceResourcesAbort?.abort();
  glanceResourcesAbort = undefined;
  glanceResourcesLoading.value = false;
};

// Some cards show more than the resource itself, e.g. a node's CPU and memory usage comes from its metrics. It's fetched each
// time the card opens so it's current, and the card shows it as loading meanwhile
const fetchGlanceResources = async(resource: any) => {
  if (!resource?.fetchGlanceResources) {
    return;
  }

  cancelGlanceResources();

  const abort = new AbortController();

  glanceResourcesAbort = abort;
  glanceResourcesLoading.value = true;

  try {
    await resource.fetchGlanceResources(abort.signal);
  } catch (e) {
    // The card can still show the resource without them
  } finally {
    // Only the latest fetch ends the loading, e.g. when the card is closed and opened again before the first one finishes
    if (glanceResourcesAbort === abort) {
      glanceResourcesAbort = undefined;
      glanceResourcesLoading.value = false;
    }
  }
};

const fetch = useFetch(async() => {
  const currentStore = props.currentStore || store.getters['currentStore'](props.type);

  const r = await store.dispatch(`${ currentStore }/find`, { type: props.type, id: props.id });

  return r;
}, { immediate: !props.lazy });

// The card's content is only mounted while the card is open, so this runs each time it opens with the resource loaded
watch(card, (neu) => {
  if (neu) {
    fetchGlanceResources(fetch.value.data);
  } else {
    cancelGlanceResources();
  }
});

onBeforeUnmount(cancelGlanceResources);

// A lazy popover fetches the resource the first time the user hovers or focuses it
const loadResource = () => {
  if (!fetch.value.data && !fetch.value.loading && !fetch.value.error) {
    fetch.value.load();
  }
};

const fallbackLocation = computed(() => props.detailLocation || fetch.value.data?.detailLocation);

const stateBackground = computed(() => {
  return fetch.value.data?.stateSimpleColor || 'unknown';
});

const resourceTypeLabel = computed(() => {
  const resource = fetch.value.data;

  if (resource?.parentNameOverride) {
    return resource.parentNameOverride;
  }

  // The type is known before the resource is fetched, e.g. while a lazy popover waits to be opened
  const type = resource?.type || props.type;
  const currentStore = store.getters['currentStore'](type);
  const schema = store.getters[`${ currentStore }/schemaFor`](type);

  return schema ? store.getters['type-map/labelFor'](schema) : '';
});

const nameDisplay = computed(() => {
  return fetch.value.data?.nameDisplay || props.name || props.id;
});

const actionInvoked = () => {
  showPopover.value = false;
};
</script>

<template>
  <!-- A lazy popover keeps its card when loading fails, because the user is hovering or focusing it at that point -->
  <PopoverCard
    v-if="!fetch.error || props.lazy"
    class="resource-popover"
    :class="{ 'wrap-name': props.wrapName }"
    :card-title="nameDisplay"
    fallback-focus="[data-testid='resource-popover-action-menu'], [data-testid='resource-popover-loading'], [data-testid='resource-popover-error']"
    :show-popover-aria-label="i18n.t('component.resource.detail.glance.ariaLabel.showDetails', { name: nameDisplay, resource: resourceTypeLabel })"
    @mouseenter="loadResource"
    @focusin="loadResource"
  >
    <span
      class="display"
      @mouseenter="showPopover=true"
    >
      <RcStatusIndicator
        v-if="props.showStatus && fetch.data"
        shape="disc"
        :status="stateBackground"
      />
      <router-link
        v-if="fallbackLocation"
        :to="fallbackLocation"
      >
        {{ nameDisplay }}
      </router-link>
      <span v-else>{{ nameDisplay }}</span>
    </span>
    <template
      v-if="fetch.data"
      #heading-action="{close}"
    >
      <ActionMenu
        :resource="fetch.data"
        :button-aria-label="i18n.t('component.resource.detail.glance.ariaLabel.actionMenu', { resource: nameDisplay })"
        data-testid="resource-popover-action-menu"
        @action-invoked="close"
      />
    </template>
    <template #card-body>
      <ResourcePopoverCard
        v-if="fetch.data"
        id="resource-popover-card"
        ref="card"
        :resource="fetch.data"
        :usage-loading="glanceResourcesLoading"
        @action-invoked="actionInvoked"
      />
      <!-- Focusable so a card opened with the keyboard has somewhere to put focus -->
      <div
        v-else-if="fetch.error"
        class="load-error text-muted"
        data-testid="resource-popover-error"
        role="status"
        tabindex="-1"
      >
        {{ i18n.t('component.resource.detail.glance.loadError') }}
      </div>
      <div
        v-else
        class="loading"
        data-testid="resource-popover-loading"
        role="status"
        tabindex="-1"
        :aria-label="i18n.t('component.resource.detail.glance.ariaLabel.loading')"
      >
        <i
          class="icon icon-spinner icon-spin"
          aria-hidden="true"
        />
      </div>
    </template>
  </PopoverCard>
  <router-link
    v-else-if="props.detailLocation"
    :to="props.detailLocation"
  >
    {{ nameDisplay }}
  </router-link>
  <span v-else>{{ nameDisplay }}</span>
</template>

<style lang="scss" scoped>
.resource-popover {
  position: relative;
  width: 100%;

  .display {
    display: inline-flex;
    align-items: center;
    max-width: 100%;

    // Truncate the link text instead of wrapping to a second line
    a {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
  }

  &.wrap-name {
    :deep(.popover-card-target) {
      width: 100%;
      height: auto;
    }

    .display a {
      white-space: normal;
      overflow-wrap: break-word;
    }
  }

  .loading, .load-error {
    // Same width as the loaded card, so the popover doesn't jump when the details replace the spinner
    width: 288px;
    padding: 16px 0;
    text-align: center;

    &:focus-visible {
      @include focus-outline;
    }
  }

  .rc-status-indicator {
      // Keep the status dot from collapsing when the link text is long
      flex-shrink: 0;
      margin-right: 12px;
      height: initial;
      line-height: initial;
  }
}
</style>
