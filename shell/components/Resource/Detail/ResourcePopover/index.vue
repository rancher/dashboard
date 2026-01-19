<script lang="ts">
import { useFetch } from '@shell/components/Resource/Detail/FetchLoader/composables';
import { useStore } from 'vuex';
import ResourcePopoverCard from '@shell/components/Resource/Detail/ResourcePopover/ResourcePopoverCard.vue';
import RcStatusIndicator from '@components/Pill/RcStatusIndicator/RcStatusIndicator.vue';
import { useI18n } from '@shell/composables/useI18n';
import { computed, ref } from 'vue';
import PopoverCard from '@shell/components/PopoverCard.vue';
import ActionMenu from '@shell/components/ActionMenuShell.vue';

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
const showPopover = ref<boolean>(false);

const fetch = useFetch(async() => {
  const currentStore = props.currentStore || store.getters['currentStore'](props.type);

  const r = await store.dispatch(`${ currentStore }/find`, { type: props.type, id: props.id });

  return r;
});

const stateBackground = computed(() => {
  return fetch.value.data?.stateSimpleColor || 'unknown';
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

const nameDisplay = computed(() => {
  return fetch.value.data?.nameDisplay || '';
});

const actionInvoked = () => {
  showPopover.value = false;
};
</script>

<template>
  <PopoverCard
    class="resource-popover"
    :card-title="nameDisplay"
    fallback-focus="[data-testid='resource-popover-action-menu']"
    :show-popover-aria-label="i18n.t('component.resource.detail.glance.ariaLabel.showDetails', { name: nameDisplay, resource: resourceTypeLabel })"
  >
    <span>
      <span
        v-if="fetch.data"
        class="display"
        @mouseenter="showPopover=true"
      >
        <RcStatusIndicator
          shape="disc"
          :status="stateBackground"
        />
        <router-link
          :to="props.detailLocation || fetch.data.detailLocation || '#'"
        >
          {{ nameDisplay }}
        </router-link>
      </span>
      <span v-else>{{ fetch.loading }}...</span>
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
    <template
      v-if="fetch.data"
      #card-body
    >
      <ResourcePopoverCard
        id="resource-popover-card"
        ref="card"
        :resource="fetch.data"
        @action-invoked="actionInvoked"
      />
    </template>
  </PopoverCard>
</template>

<style lang="scss" scoped>
.resource-popover {
  position: relative;
  width: 100%;

  .display {
    display: inline-flex;
  }

  .rc-status-indicator {
      margin-right: 12px;
      margin-top: 4px;
      height: initial;
      line-height: initial;
  }
}
</style>
