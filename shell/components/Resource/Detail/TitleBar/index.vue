<script lang="ts">
import BadgeState from '@components/BadgeState/BadgeState.vue';
import { RouteLocationRaw, useRouter } from 'vue-router';
import Title from '@shell/components/Resource/Detail/TitleBar/Title.vue';
import Top from '@shell/components/Resource/Detail/TitleBar/Top.vue';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import RcButton from '@components/RcButton/RcButton.vue';
import TabTitle from '@shell/components/TabTitle';
import { computed, ref, watch } from 'vue';
import { _CONFIG, AS } from '@shell/config/query-params';
import { ExtensionPoint, PanelLocation } from '@shell/core/types';
import ExtensionPanel from '@shell/components/ExtensionPanel.vue';

export interface Badge {
  color: 'bg-success' | 'bg-error' | 'bg-warning' | 'bg-info';
  label: string;
}

export interface TitleBarProps {
  resource: any;
  resourceTypeLabel: string;
  resourceName: string;

  resourceTo?: RouteLocationRaw;
  description?: string;
  badge?: Badge;

  // This should be replaced with a list of menu items we want to render.
  // I don't have the time right now to swap this out though.
  actionMenuResource?: any;
  onShowConfiguration?: (returnFocusSelector: string) => void;
}

const showConfigurationIcon = require(`@shell/assets/images/icons/document.svg`);
</script>

<script setup lang="ts">
const {
  resource, resourceTypeLabel, resourceTo, resourceName, description, badge, onShowConfiguration,
} = defineProps<TitleBarProps>();

const store = useStore();
const i18n = useI18n(store);
const router = useRouter();

const emit = defineEmits(['show-configuration']);
const showConfigurationDataTestId = 'show-configuration-cta';
const showConfigurationReturnFocusSelector = computed(() => `[data-testid="${ showConfigurationDataTestId }"]`);

const currentView = ref(router?.currentRoute?.value?.query?.as || _CONFIG);

watch(
  () => currentView.value,
  () => {
    router.push({ query: { [AS]: currentView.value } });
  }
);
</script>

<template>
  <div class="title-bar">
    <Top>
      <Title class="title">
        <TabTitle :show-child="false">
          {{ resourceTypeLabel }}
        </TabTitle>
        <router-link
          v-if="resourceTo"
          :to="resourceTo"
          class="resource-link"
        >
          {{ resourceTypeLabel }}:
        </router-link>
        <span
          v-else
          class="resource-text"
        >
          {{ resourceTypeLabel }}:
        </span>
        <span class="resource-name masthead-resource-title">
          {{ resourceName }}
        </span>
        <BadgeState
          v-if="badge"
          class="badge-state"
          :color="badge.color"
          :label="badge.label"
        />
      </Title>
      <div class="actions">
        <slot name="additional-actions" />
        <RcButton
          v-if="onShowConfiguration"
          :data-testid="showConfigurationDataTestId"
          class="show-configuration"
          :primary="true"
          :aria-label="i18n.t('component.resource.detail.titleBar.ariaLabel.showConfiguration', { resource: resourceName })"
          @click="() => emit('show-configuration', showConfigurationReturnFocusSelector)"
        >
          <img
            :src="showConfigurationIcon"
            class="mmr-3"
            aria-hidden="true"
          >
          {{ i18n.t('component.resource.detail.titleBar.showConfiguration') }}
        </RcButton>
        <ActionMenu
          v-if="actionMenuResource"
          button-role="multiAction"
          :resource="actionMenuResource"
          data-testid="masthead-action-menu"
          :button-aria-label="i18n.t('component.resource.detail.titleBar.ariaLabel.actionMenu', { resource: resourceName })"
        />
      </div>
    </Top>
    <div
      v-if="description"
      class="bottom description text-deemphasized"
    >
      {{ description }}
    </div>
    <ExtensionPanel
      :resource="resource"
      :type="ExtensionPoint.PANEL"
      :location="PanelLocation.DETAILS_MASTHEAD"
    />
  </div>
</template>

<style lang="scss" scoped>
.title-bar {
  min-width: 740px;

  .badge-state {
    font-size: 16px;
    margin-left: 12px;
    position: relative;
  }

  .show-configuration {
    margin-left: 16px;
  }

  &:deep() button[data-testid="masthead-action-menu"] {
    border-radius: 4px;
    width: 35px;
    height: 40px;
    margin-left: 16px;

    display: inline-flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  .description {
    max-width: 60%;
  }

  // This prevents the title from overlapping with the actions
  .title {
    max-width: calc(100% - 260px);
  }

  // We want the resource name to be what collaspes wh
  .resource-name {
    display: inline-block;
    flex: 1;
    white-space: nowrap;
    overflow-x: hidden;
    overflow-y: clip;
    text-overflow: ellipsis;
    margin-left: 4px;
  }
}
</style>
