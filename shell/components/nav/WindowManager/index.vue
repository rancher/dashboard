<script>
import { mapState } from 'vuex';
import debounce from 'lodash/debounce';
import {
  screenRect, boundingRect, BOTTOM, RIGHT, LEFT
} from '@shell/utils/position';

export default {
  emits: ['draggable'],

  data() {
    return {
      dragOffset:     0,
      reportedHeight: this.height,
      reportedWidth:  this.width,
      component:      { },
    };
  },

  computed: {
    ...mapState('wm', ['tabs', 'active', 'open', 'userHeight', 'userWidth', 'userPin']),

    height: {
      get() {
        if ( this.userHeight ) {
          return this.userHeight;
        }

        const windowHeight = window.innerHeight;
        let height = parseInt(window.localStorage.getItem('wm-height'), 10);

        if ( !height ) {
          height = Math.round(windowHeight / 2);
        }
        height = Math.min(height, 3 * windowHeight / 4);

        window.localStorage.setItem('wm-height', height);

        return height;
      },

      set(val) {
        this.$store.commit('wm/setUserHeight', val);
        window.localStorage.setItem('wm-height', val);
        this.show();

        return val;
      },
    },

    width: {
      get() {
        if (this.userWidth) {
          return this.userWidth;
        }

        const windowWidth = window.innerWidth;
        let width = parseInt(window.localStorage.getItem('wm-width'), 10);

        if (!width) {
          width = Math.round(windowWidth / 8);
        }
        width = Math.min(width, 3 * windowWidth / 4);

        window.localStorage.setItem('wm-width', width);

        return width;
      },
      set(val) {
        this.$store.commit('wm/setUserWidth', val);
        window.localStorage.setItem('wm-width', val);
        this.show();

        return val;
      }
    },

    pinClass() {
      return `pin-${ this.userPin }`;
    },
  },

  watch: {
    userPin(v) {
      if (this.open) {
        this.setWmDimensions();
        if (v === LEFT || v === RIGHT) {
          this.setReportedHeight(window.innerHeight - 55);
        }
      }
    },

    tabs() {
      this.toggle(true);
    },

    open(neu) {
      if ( neu ) {
        this.setReportedHeight();
        this.show();
      } else {
        this.hide();
      }
    },
  },

  mounted() {
    this.toggle(true);
    this.queueUpdate = debounce(this.setReportedHeight, 250);
  },

  methods: {
    switchTo(id) {
      this.$store.commit('wm/setActive', id);
    },

    toggle(reverse = false) {
      if ( this.dragging ) {
        return;
      }

      if ( this.open ^ reverse ) {
        this.hide();
      } else {
        this.show();
      }
    },

    show() {
      this.setWmDimensions();
      this.$store.commit('wm/setOpen', true);
    },

    hide() {
      if ( this.tabs.length ) {
        document.documentElement.style.setProperty('--wm-height', `calc(var(--wm-tab-height, 29px) + 2px)`);
      } else {
        document.documentElement.style.setProperty('--wm-height', '0');
        document.documentElement.style.setProperty('--wm-width', '0');
      }

      this.$store.commit('wm/setOpen', false);
    },

    dragYStart(event) {
      const doc = document.documentElement;

      doc.addEventListener('mousemove', this.dragYMove);
      doc.addEventListener('touchmove', this.dragYMove, true);
      doc.addEventListener('mouseup', this.dragYEnd);
      doc.addEventListener('mouseleave', this.dragYEnd);
      doc.addEventListener('touchend touchcancel', this.dragYEnd, true);
      doc.addEventListener('touchstart', this.dragYEnd, true);

      const eventY = event.screenY;

      const rect = boundingRect(event.target);
      const offset = eventY - rect.top;

      this.dragOffset = offset;
    },

    dragYMove(event) {
      const screen = screenRect();
      const eventY = event.screenY;
      const min = 50;
      const max = Math.round( 3 * screen.height / 4);

      let neu = screen.height - eventY + this.dragOffset;

      neu = Math.max(min, Math.min(neu, max));

      this.height = neu;
      this.dragging = true;
      this.queueUpdate();
    },

    dragYEnd(event) {
      const doc = document.documentElement;

      doc.removeEventListener('mousemove', this.dragYMove);
      doc.removeEventListener('touchmove', this.dragYMove, true);
      doc.removeEventListener('mouseup', this.dragYEnd);
      doc.removeEventListener('mouseleave', this.dragYEnd);
      doc.removeEventListener('touchend touchcancel', this.dragYEnd, true);
      doc.removeEventListener('touchstart', this.dragYEnd, true);

      this.setReportedHeight();
      setTimeout(() => {
        this.dragging = false;
      }, 100);
    },

    dragXStart(event) {
      const doc = document.documentElement;

      doc.addEventListener('mousemove', this.dragXMove);
      doc.addEventListener('touchmove', this.dragXMove, true);
      doc.addEventListener('mouseup', this.dragXEnd);
      doc.addEventListener('mouseleave', this.dragXEnd);
      doc.addEventListener('touchend touchcancel', this.dragXEnd, true);
      doc.addEventListener('touchstart', this.dragXEnd, true);

      const eventX = event.screenX;
      const rect = boundingRect(event.target);

      switch (this.userPin) {
      case RIGHT:
        this.dragOffset = eventX - rect.left;
        break;
      case LEFT:
        this.dragOffset = rect.right - eventX;
        break;
      }
    },

    dragXMove(event) {
      const screen = screenRect();
      const eventX = event.screenX;

      const min = 250;
      const max = Math.round(2 * screen.width / 5);
      let neu;

      switch (this.userPin) {
      case RIGHT:
        neu = screen.width - eventX + this.dragOffset;
        break;
      case LEFT:
        neu = eventX + this.dragOffset;
        break;
      }

      neu = Math.max(min, Math.min(neu, max));
      this.width = neu;
      this.dragging = true;
      debounce(this.setReportedWidth, 250)();
    },

    dragXEnd(event) {
      const doc = document.documentElement;

      doc.removeEventListener('mousemove', this.dragXMove);
      doc.removeEventListener('touchmove', this.dragXMove, true);
      doc.removeEventListener('mouseup', this.dragXEnd);
      doc.removeEventListener('mouseleave', this.dragXEnd);
      doc.removeEventListener('touchend touchcancel', this.dragXEnd, true);
      doc.removeEventListener('touchstart', this.dragXEnd, true);

      this.setReportedWidth();
      setTimeout(() => {
        this.dragging = false;
      }, 100);
    },

    setReportedHeight(height = this.height) {
      this.reportedHeight = height;
    },

    setReportedWidth() {
      this.reportedWidth = this.width;
    },

    setWmDimensions(forceValue) {
      switch (this.userPin) {
      case RIGHT:
      case LEFT:
        document.documentElement.style.setProperty('--wm-height', `${ window.innerHeight - 55 }px`);
        document.documentElement.style.setProperty('--wm-width', `${ forceValue || this.width }px`);
        break;
      case BOTTOM:
        document.documentElement.style.setProperty('--wm-height', `${ forceValue || this.height }px`);
        break;
      }
    },

    close(id) {
      this.$store.dispatch('wm/close', id);
    },

    componentFor(tab) {
      if (this.component[tab.component] === undefined) {
        if (this.$store.getters['type-map/hasCustomWindowComponent'](tab.component)) {
          this.component[tab.component] = this.$store.getters['type-map/importWindowComponent'](tab.component);
        } else {
          console.warn(`Unable to find window component for type '${ tab.component }'`); // eslint-disable-line no-console
          this.component[tab.component] = null;
        }
      }

      return this.component[tab.component];
    },

    emitDraggable(event) {
      this.$emit('draggable', event);
    },

    resizeVertical(arrowUp) {
      const resizeStep = 20;
      const height = arrowUp ? this.height + resizeStep : this.height - resizeStep;

      this.height = height;

      this.setWmDimensions(height);
      this.setReportedHeight(height);
    },

    resizeHorizontal(arrowLeft) {
      const resizeStep = 20;
      let width;

      if (this.userPin === 'left') {
        width = arrowLeft ? this.width - resizeStep : this.width + resizeStep;
      } else {
        width = arrowLeft ? this.width + resizeStep : this.width - resizeStep;
      }

      this.width = width;

      this.setWmDimensions(width);
      this.setReportedWidth(width);
    }
  }
};
</script>

<template>
  <div
    id="windowmanager"
    data-testid="windowmanager"
    class="windowmanager"
    :class="{[pinClass]: true}"
  >
    <div
      ref="tabs"
      class="tabs"
      :class="{
        'resizer-left': userPin == 'left',
      }"
      role="tablist"
      @keyup.right.prevent="selectNext(1)"
      @keyup.left.prevent="selectNext(-1)"
      @mousedown="emitDraggable(true)"
      @mouseup="emitDraggable(false)"
    >
      <div
        v-if="userPin == 'right'"
        class="resizer resizer-x"
        role="button"
        tabindex="0"
        :aria-label="t('wm.containerShell.resizeShellWindow', {arrow1: 'left', arrow2: 'right'})"
        aria-expanded="true"
        @mousedown.prevent.stop="dragXStart($event)"
        @touchstart.prevent.stop="dragXStart($event)"
        @keyup.left.prevent.stop="resizeHorizontal(true)"
        @keyup.right.prevent.stop="resizeHorizontal(false)"
      >
        <i
          class="icon icon-code"
          :alt="t('wm.containerShell.resizeShellWindow', {arrow1: 'left', arrow2: 'right'})"
        />
      </div>
      <div
        v-for="(tab, i) in tabs"
        :key="i"
        class="tab"
        :class="{'active': tab.id === active}"
        role="tab"
        :aria-selected="tab.id === active"
        :aria-label="tab.label"
        :aria-controls="`panel-${tab.id}`"
        tabindex="0"
        @click="switchTo(tab.id)"
        @keyup.enter.space="switchTo(tab.id)"
      >
        <i
          v-if="tab.icon"
          class="icon"
          :class="{['icon-'+ tab.icon]: true}"
          :alt="t('wm.containerShell.tabIcon')"
        />
        <span class="tab-label"> {{ tab.label }}</span>
        <i
          data-testid="wm-tab-close-button"
          class="closer icon icon-fw icon-x wm-closer-button"
          :alt="t('wm.containerShell.closeShellTab', { tab: tab.label })"
          tabindex="0"
          :aria-label="t('windowmanager.closeTab', { tabId: tab.id })"
          @click.stop="close(tab.id)"
          @keyup.enter.space.stop="close(tab.id)"
        />
      </div>
      <div
        v-if="userPin == 'bottom'"
        class="resizer resizer-y"
        role="button"
        tabindex="0"
        :aria-label="t('wm.containerShell.resizeShellWindow', {arrow1: 'up', arrow2: 'down'})"
        aria-expanded="true"
        @mousedown.prevent.stop="dragYStart($event)"
        @touchstart.prevent.stop="dragYStart($event)"
        @click="toggle"
        @keyup.up.prevent.stop="resizeVertical(true)"
        @keyup.down.prevent.stop="resizeVertical(false)"
      >
        <i
          class="icon icon-sort"
          :alt="t('wm.containerShell.resizeShellWindow', {arrow1: 'up', arrow2: 'down'})"
        />
      </div>
      <div
        v-if="userPin == 'left'"
        class="resizer resizer-x resizer-align-right"
        role="button"
        tabindex="0"
        :aria-label="t('wm.containerShell.resizeShellWindow', {arrow1: 'left', arrow2: 'right'})"
        aria-expanded="true"
        @mousedown.prevent.stop="dragXStart($event)"
        @touchstart.prevent.stop="dragXStart($event)"
        @keyup.left.prevent.stop="resizeHorizontal(true)"
        @keyup.right.prevent.stop="resizeHorizontal(false)"
      >
        <i
          class="icon icon-code"
          :alt="t('wm.containerShell.resizeShellWindow', {arrow1: 'left', arrow2: 'right'})"
        />
      </div>
    </div>
    <div
      v-for="(tab, i) in tabs"
      :id="`panel-${tab.id}`"
      :key="i"
      class="body"
      :class="{'active': tab.id === active}"
      draggable="false"
      role="tabpanel"
      @dragstart.prevent.stop
      @dragend.prevent.stop
      @mouseover="emitDraggable(false)"
    >
      <component
        :is="componentFor(tab)"
        :tab="tab"
        :active="tab.id === active"
        :height="reportedHeight"
        :width="reportedWidth"
        v-bind="tab.attrs"
        @close="close(tab.id)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .windowmanager {
    display: grid;
    height: var(--wm-height, 0);

    grid-template-areas:
      "tabs"
      "body";

    grid-template-rows: var(--wm-tab-height) auto;

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

        .tab-label{
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &.active {
          position: relative;
          background-color: var(--wm-body-bg);
          outline: 1px solid var(--wm-body-bg);
          z-index: 1;
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

      .resizer-y {
        cursor: ns-resize;
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

    &.pin-right {
      border-left: var(--nav-border-size) solid var(--nav-border);
    }

    &.pin-left {
      border-right: var(--nav-border-size) solid var(--nav-border);
    }
  }

</style>
