<script lang="ts">
import { useFetch } from '@shell/components/Resource/Detail/FetchLoader/composables';
import { useStore } from 'vuex';
import ResourcePopoverCard from '@shell/components/Resource/Detail/ResourcePopover/ResourcePopoverCard.vue';
import RcStatusIndicator from '@components/Pill/RcStatusIndicator/RcStatusIndicator.vue';
import { useI18n } from '@shell/composables/useI18n';
import { computed, ref, watch } from 'vue';
import {
  DEFAULT_FOCUS_TRAP_OPTS,
  useWatcherBasedSetupFocusTrapWithDestroyIncluded
} from '@shell/composables/focusTrap';

export interface Props {
  type: string;
  id: string;
  currentStore?: string;
  detailLocation?: object;
}
</script>

<script setup lang="ts">
const store = useStore();
const i18n = useI18n(store);
const props = defineProps<Props>();
const card = ref<any>(null);
const popoverContainer = ref(null);
const showPopover = ref<boolean>(false);
const focusOpen = ref<boolean>(false);

const fetch = useFetch(async() => {
  const currentStore = props.currentStore || store.getters['currentStore'](props.type);

  return store.dispatch(`${ currentStore }/find`, { type: props.type, id: props.id });
});

const resourceTypeLabel = computed(() => {
  if (!fetch.value.data) {
    return '';
  }

  const resource = fetch.value.data;
  const currentStore = store.getters['currentStore'](resource.type);
  const schema = store.getters[`${ currentStore }/schemaFor`](resource.type);

  return resource.parentNameOverride || store.getters['type-map/labelFor'](schema);
});

const actionInvoked = () => {
  showPopover.value = false;
};

// Set focus trap when card opened using keyboard
watch(
  () => card.value,
  (neu) => {
    if (neu && focusOpen.value) {
      const opts = {
        ...DEFAULT_FOCUS_TRAP_OPTS,
        fallbackFocus:  '#first-glance-item',
        setReturnFocus: () => '.focus-button'
      };

      useWatcherBasedSetupFocusTrapWithDestroyIncluded(() => showPopover.value, '#resource-popover-card', opts);
    }
  }
);
</script>

<template>
  <div
    class="resource-popover"
    @mouseleave="showPopover=false"
  >
    <v-dropdown
      :triggers="[]"
      :container="popoverContainer"
      :shown="showPopover"
      placement="bottom-start"
      :aria-label="i18n.t('component.resource.detail.glance.ariaLabel.showDetails', { name: fetch.data?.nameDisplay, resource: resourceTypeLabel })"
    >
      <div class="target">
        <span class="display-container">
          <span
            v-if="fetch.data"
            class="display"
            @mouseenter="showPopover=true"
          >
            <RcStatusIndicator
              shape="disc"
              :status="fetch.data?.stateBackground || 'unknown'"
            />
            <router-link
              :to="props.detailLocation || fetch.data.detailLocation || '#'"
            >
              {{ fetch.data.nameDisplay }}
            </router-link>
            <div
              ref="popoverContainer"
              class="resource-popover-container"
            >
              <!--Empty container for mounting popper content-->
            </div>
          </span>
          <span v-else>...</span>
          <button
            v-if="fetch.data"
            class="focus-button role-secondary"
            :aria-label="i18n.t('component.resource.detail.glance.ariaLabel.showDetails', { name: fetch.data?.nameDisplay, resource: resourceTypeLabel })"
            aria-haspopup="true"
            :aria-expanded="showPopover"
            @click="showPopover=true; focusOpen=true;"
          >
            <i class="icon icon-chevron-down icon-sm" />
          </button>
        </span>
      </div>

      <template #popper>
        <ResourcePopoverCard
          v-if="showPopover"
          id="resource-popover-card"
          ref="card"
          :resource="fetch.data"
          @action-invoked="actionInvoked"
          @keydown.escape="showPopover=false; focusOpen=false"
        />
      </template>
    </v-dropdown>
  </div>
</template>

<style lang="scss" scoped>
.resource-popover {
  position: relative;
  width: 100%;

  .target, a {
    @include clip;
  }

  .display-container {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  }

  .display {
    display: inline-flex;
    max-width: 100%;
    a {
      flex: 1;
    }
  }

  .target {
    width: 100%;
    height: 17px;
  }

  .focus-button {
    margin-left: 4px;
    padding: 0;
    width: 0px;
    height: initial;
    min-height: initial;
    overflow: hidden;
    border-width: 0;

    &:focus {
      width: initial;
      border-width: 1px;
    }
  }

  .rc-status-indicator {
      margin-right: 12px;
      margin-top: 4px;
      height: initial;
      line-height: initial;
  }

  .resource-popover-card {
    border: none;
  }

  .resource-popover-container {
    position: absolute;
    $size: 10px;
    height: $size;
    bottom: -$size;
    width: 100%;
  }

  &:deep() {
    & > .v-popper > .btn.role-link {
      padding: 0;
      min-height: initial;
      line-height: initial;

      &:hover {
        background: none;
      }
    }

    .resource-popover-container > .v-popper__popper {
      border-radius: 6px;
      box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.04);

      & > .v-popper__wrapper {
        .v-popper__arrow-container {
          display: none;
        }

        & > .v-popper__inner {
          overflow: initial;
          &, & > div > .dropdownTarget {
            padding: 0;
          }
        }
      }
    }
  }
}
</style>
