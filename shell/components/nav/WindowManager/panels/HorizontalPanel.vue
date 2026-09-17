<script setup lang="ts">
import { PropType } from 'vue';
import { RcButton } from '@components/RcButton';
import { RcIcon } from '@components/RcIcon';
import { BOTTOM } from '@shell/utils/position';
import { Position } from '@shell/types/window-manager';
import TabBodyContainer from './TabBodyContainer.vue';
import { tabBodyId } from './tab-body';
import usePanelHandler from '../composables/usePanelHandler';

const props = defineProps({
  position: {
    type:    String as PropType<Position>,
    default: BOTTOM,
  },
});

const {
  tabs,
  activeTab,
  activePanelTab,
  isTabsHeaderEnabled,
  dragOverPositionsActive,
  dragOverTabBarActive,
  setTabActive,
  onTabReady,
  onTabClose,
  closeActiveTab,
  onTabKeydown,
  mouseResizeYStart,
  keyboardResizeY,
  onTabBarDragOver,
  onTabBarDragLeave,
  onTabBarDrop,
  onDragPositionStart,
  onDragPositionEnd,
  lockedPosition,
} = usePanelHandler({ position: props.position });
</script>

<template>
  <div
    id="horizontal-window-manager"
    data-testid="horizontal-window-manager"
    class="horizontal-window-manager wm"
    :class="{
      'drag-start': dragOverPositionsActive,
      'drag-end': !dragOverPositionsActive,
      'tabs-header-enabled': isTabsHeaderEnabled,
    }"
  >
    <div
      v-if="isTabsHeaderEnabled"
      :class="['tabs', { 'tab-bar-highlight': dragOverTabBarActive }]"
      @dragover="onTabBarDragOver"
      @dragleave="onTabBarDragLeave"
      @drop="onTabBarDrop"
    >
      <div
        class="tab-list"
        role="tablist"
        :aria-label="t('wm.tabList')"
      >
        <div
          v-for="(tab, i) in tabs"
          :key="i"
          class="tab"
          :class="{
            'active': tab.id === activeTab[props.position],
            'draggable': !lockedPosition,
          }"
          :draggable="tab.id === activeTab[props.position] && !lockedPosition"
          role="tab"
          :aria-selected="tab.id === activeTab[props.position]"
          :aria-label="tab.label"
          :aria-controls="tabBodyId(props.position, tab.id)"
          aria-keyshortcuts="Delete"
          tabindex="0"
          @click="setTabActive({ position: props.position, id: tab.id })"
          @keyup.enter.space="setTabActive({ position: props.position, id: tab.id })"
          @keydown="onTabKeydown($event, tab.id)"
          @dragstart="onDragPositionStart({ event: $event, tab })"
          @dragend="onDragPositionEnd({ event: $event, tab })"
        >
          <i
            v-if="tab.icon"
            class="icon"
            :class="{
              ['icon-'+ tab.icon]: true,
            }"
            :alt="t('wm.tabIcon')"
          />
          <span
            class="tab-label"
          >
            {{ tab.label }}
          </span>
          <span
            data-testid="wm-tab-close-button"
            class="closer wm-closer-button"
            aria-hidden="true"
            @click.stop="onTabClose(tab.id)"
          >
            <RcIcon
              type="close"
              size="inherit"
            />
          </span>
        </div>
      </div>
      <RcButton
        v-if="activePanelTab"
        data-testid="wm-close-active-tab-button"
        variant="ghost"
        size="small"
        class="close-active-tab"
        :aria-label="t('wm.closeTab', { tabLabel: activePanelTab.label })"
        @click="closeActiveTab($event)"
      >
        <RcIcon
          v-clean-tooltip="t('wm.closeTab', { tabLabel: activePanelTab.label })"
          type="close"
          size="inherit"
        />
      </RcButton>
      <div
        class="resizer resizer-y"
        role="button"
        tabindex="0"
        :aria-label="t('wm.resize', {arrow1: 'up', arrow2: 'down'})"
        aria-expanded="true"
        @mousedown.prevent.stop="mouseResizeYStart($event)"
        @touchstart.prevent.stop="mouseResizeYStart($event)"
        @keyup.up.prevent.stop="keyboardResizeY(true)"
        @keyup.down.prevent.stop="keyboardResizeY(false)"
      >
        <i
          class="icon icon-sort"
          :alt="t('wm.resize', {arrow1: 'up', arrow2: 'down'})"
        />
      </div>
    </div>
    <TabBodyContainer
      v-for="tab in tabs"
      v-show="tab.id === activeTab[props.position]"
      :id="tab.id"
      :key="`${ props.position }-${ tab.id }`"
      :position="props.position"
      @ready="onTabReady({ tab, containerId: $event })"
    />
  </div>
</template>

<style lang="scss" scoped>
  .horizontal-window-manager {
    display: grid;
    // z-index: var(--drag-area-wm-z-index);

    grid-template-areas:
      "body";
    grid-template-rows: auto;
    grid-template-columns: minmax(0, 1fr);

    &.tabs-header-enabled {
      grid-template-areas:
        "tabs"
        "body";

      grid-template-rows: var(--wm-tab-height) auto;
    }

    &.vm {
      height: var(--wm-height, 0);
    }

    .tabs, .body {
      max-width: 100%;
    }

    .tabs {
      grid-area: tabs;
      background-color: var(--wm-tabs-bg);
      border-top: 1px solid var(--wm-border);
      border-bottom: 1px solid var(--wm-border);

      display: flex;
      align-content: stretch;

      .tab-list {
        display: flex;
        flex: 0 1 auto;
        min-width: 0;
        overflow: hidden;
      }

      .tab {
        cursor: pointer;
        user-select: none;
        border-top: 1px solid var(--wm-border);
        border-right: 1px solid var(--wm-border);
        border-left: 1px solid var(--wm-border);
        padding: 5px 10px;
        overflow: hidden;
        text-overflow: ellipsis;
        margin: 0;
        display: flex;
        min-width: 0;

        .tab-label {
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &.active {
          position: relative;
          background-color: var(--wm-body-bg);
          outline: 1px solid var(--wm-body-bg);
          z-index: 1;
        }

        &.draggable {
          cursor: grab;
        }

        &:focus-visible {
          @include focus-outline;
          outline-offset: -3px;
        }

        .closer {
          margin-left: 5px;
          border: 1px solid var(--body-text);
          border-radius: var(--border-radius);
          line-height: 12px;
          font-size: 10px;
          width: 14px;
          min-width: 14px;
          height: 14px;
          color: var(--body-text);
          align-self: center;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;

          &:hover {
            border-color: var(--link-border);
            color: var(--link-border);
          }

          .icon,
          .rc-icon {
            font-size: 10px;
            line-height: 1;
          }
        }
      }

      .resizer, .close-active-tab {
        width: var(--wm-tab-height);
        padding: 0 5px;
        margin: 0 0 0 1px;
        text-align: center;
        border-left: 1px solid var(--wm-border);
        border-right: 1px solid var(--wm-border);
        line-height: var(--wm-tab-height);
        height: calc(var(--wm-tab-height) + 1px);
        flex: 0 0 auto;

        &:hover {
          background-color: var(--wm-closer-hover-bg);
        }
      }

      .close-active-tab {
        min-width: var(--wm-tab-height);
        min-height: 0;
        border-top: none;
        border-bottom: none;
        border-radius: 0;
        font-size: 14px;
        color: var(--body-text);

        &:focus-visible {
          @include focus-outline;
          outline-offset: -3px;
        }
      }

      .resizer-y {
        cursor: ns-resize;
      }
    }

    .body {
      grid-area: body;
      background-color: var(--wm-body-bg);
      display: none;
      overflow: hidden;

      &.active {
        display: block;
        height: 100%;
      }
    }
  }

  .drag-start {
    z-index: var(--drag-area-wm-z-index);
    opacity: 0.5;
    transition: opacity .3s ease;
  }

  .drag-end {
    opacity: 1;
  }

  .tab-bar-highlight {
    transition: height .5s ease;
    background-image: linear-gradient(to top, var(--drag-over-inner-bg), var(--drag-over-outer-bg));
    border-style: dashed hidden hidden hidden;
  }
</style>
