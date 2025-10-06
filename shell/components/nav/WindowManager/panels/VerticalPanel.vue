<script setup lang="ts">
import { RIGHT, LEFT } from '@shell/utils/position';
import { PropType } from 'vue';
import { Position } from '@shell/types/window-manager';
import TabBodyContainer from './TabBodyContainer.vue';
import usePanelHandler from '../composables/usePanelHandler';

const props = defineProps({
  position: {
    type:    String as PropType<Position>,
    default: RIGHT,
  },
});

const {
  tabs,
  activeTab,
  isTabsHeaderEnabled,
  dragOverPositionsActive,
  dragOverTabBarActive,
  setTabActive,
  onTabReady,
  onTabClose,
  mouseResizeXStart,
  keyboardResizeX,
  lockedPosition,
  onTabBarDragOver,
  onTabBarDragLeave,
  onTabBarDrop,
  onDragPositionStart,
  onDragPositionEnd,
} = usePanelHandler({ position: props.position });
</script>

<template>
  <div
    id="vertical-window-manager"
    data-testid="vertical-window-manager"
    class="vertical-window-manager"
    :class="{
      'wm-vr': props.position === RIGHT,
      'wm-vl': props.position === LEFT,
      'drag-start': dragOverPositionsActive,
      'drag-end': !dragOverPositionsActive,
      'tabs-header-enabled': isTabsHeaderEnabled,
    }"
  >
    <div
      v-if="isTabsHeaderEnabled"
      :class="[
        'tabs',
        {
          'tab-bar-highlight': dragOverTabBarActive,
          'resizer-left': props.position === LEFT,
        }
      ]"
      role="tablist"
      @dragover="onTabBarDragOver"
      @dragleave="onTabBarDragLeave"
      @drop="onTabBarDrop"
    >
      <div
        v-if="props.position === RIGHT"
        class="resizer resizer-x"
        role="button"
        tabindex="0"
        :aria-label="t('wm.resize', {arrow1: 'left', arrow2: 'right'})"
        aria-expanded="true"
        @mousedown.prevent.stop="mouseResizeXStart($event)"
        @touchstart.prevent.stop="mouseResizeXStart($event)"
        @keyup.left.prevent.stop="keyboardResizeX(true)"
        @keyup.right.prevent.stop="keyboardResizeX(false)"
      >
        <i
          class="icon icon-code"
          :alt="t('wm.resize', {arrow1: 'left', arrow2: 'right'})"
        />
      </div>
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
        :aria-controls="`panel-${tab.id}`"
        tabindex="0"
        @click="setTabActive({ position: props.position, id: tab.id })"
        @keyup.enter.space="setTabActive({ position: props.position, id: tab.id })"
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
        <i
          data-testid="wm-tab-close-button"
          class="closer icon icon-x wm-closer-button"
          :alt="t('wm.closeTab', { tabId: tab.label })"
          tabindex="0"
          :aria-label="t('wm.closeTab', { tabId: tab.id })"
          @click.stop="onTabClose(tab.id)"
          @keyup.enter.space.stop="onTabClose(tab.id)"
        />
      </div>
      <div
        v-if="props.position === LEFT"
        class="resizer resizer-x resizer-align-right"
        role="button"
        tabindex="0"
        :aria-label="t('wm.resize', {arrow1: 'left', arrow2: 'right'})"
        aria-expanded="true"
        @mousedown.prevent.stop="mouseResizeXStart($event)"
        @touchstart.prevent.stop="mouseResizeXStart($event)"
        @keyup.left.prevent.stop="keyboardResizeX(true)"
        @keyup.right.prevent.stop="keyboardResizeX(false)"
      >
        <i
          class="icon icon-code"
          :alt="t('wm.resize', {arrow1: 'left', arrow2: 'right'})"
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
  .vertical-window-manager {
    display: grid;
    // z-index: var(--drag-area-wm-z-index);

    grid-template-areas:
      "body";
    grid-template-rows: auto;

    &.tabs-header-enabled {
      grid-template-areas:
        "tabs"
        "body";

      grid-template-rows: var(--wm-tab-height) auto;
    }

    &.wm-vr {
      width: var(--wm-vr-width, 0);
      border-left: var(--nav-border-size) solid var(--nav-border);
    }

    &.wm-vl {
      width: var(--wm-vl-width, 0);
      border-right: var(--nav-border-size) solid var(--nav-border);
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
          align-self: center;
          display: flex;
          justify-content: center;
          cursor: pointer;

          &:hover {
            border-color: var(--link-border);
            color: var(--link-border);
          }

          &:focus-visible {
            @include focus-outline;
            outline-offset: 1px;
          }
        }
      }

      .resizer {
        width: var(--wm-tab-height);
        padding: 0 5px;
        margin: 0 0 0 1px;
        text-align: center;
        border-left: 1px solid var(--wm-border);
        border-right: 1px solid var(--wm-border);
        line-height: var(--wm-tab-height);
        height: calc(var(--wm-tab-height) + 1px);
        flex-grow: 0;

        &:hover {
          background-color: var(--wm-closer-hover-bg);
        }
      }

      .resizer-x {
        cursor: col-resize;
      }

      .resizer-align-right {
        margin-left: auto;
      }

      &.resizer-left {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
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
