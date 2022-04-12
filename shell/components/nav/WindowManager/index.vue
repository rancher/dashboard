<script>
import { mapState } from 'vuex';
import debounce from 'lodash/debounce';
import { screenRect, boundingRect } from '@shell/utils/position';

export default {
  data() {
    return {
      dragOffset:     0,
      reportedHeight: this.height,
      firstHeight:    true,
      component:      { },
    };
  },

  computed: {
    ...mapState('wm', ['tabs', 'active', 'open', 'userHeight']),

    height: {
      get() {
        if ( process.server ) {
          return 0;
        }

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
  },

  watch: {
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
      document.documentElement.style.setProperty('--wm-height', `${ this.height }px`);
      this.$store.commit('wm/setOpen', true);
    },

    hide() {
      if ( this.tabs.length ) {
        document.documentElement.style.setProperty('--wm-height', `calc(var(--wm-tab-height, 29px) + 2px)`);
      } else {
        document.documentElement.style.setProperty('--wm-height', '0');
      }

      this.$store.commit('wm/setOpen', false);
    },

    dragStart(event) {
      const doc = document.documentElement;

      doc.addEventListener('mousemove', this.dragMove);
      doc.addEventListener('touchmove', this.dragMove, true);
      doc.addEventListener('mouseup', this.dragEnd);
      doc.addEventListener('mouseleave', this.dragEnd);
      doc.addEventListener('touchend touchcancel', this.dragEnd, true);
      doc.addEventListener('touchstart', this.dragEnd, true);

      const eventY = event.screenY;
      const rect = boundingRect(event.target);
      const offset = eventY - rect.top;

      this.dragOffset = offset;
    },

    dragMove(event) {
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

    dragEnd(event) {
      const doc = document.documentElement;

      doc.removeEventListener('mousemove', this.dragMove);
      doc.removeEventListener('touchmove', this.dragMove, true);
      doc.removeEventListener('mouseup', this.dragEnd);
      doc.removeEventListener('mouseleave', this.dragEnd);
      doc.removeEventListener('touchend touchcancel', this.dragEnd, true);
      doc.removeEventListener('touchstart', this.dragEnd, true);

      this.setReportedHeight();
      setTimeout(() => {
        this.dragging = false;
      }, 100);
    },

    setReportedHeight() {
      this.reportedHeight = this.height;
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
    }
  }
};
</script>

<template>
  <div id="windowmanager" class="windowmanager">
    <div ref="tabs" class="tabs">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{'active': tab.id === active}"
        @click="switchTo(tab.id)"
      >
        <i v-if="tab.icon" class="icon" :class="{['icon-'+ tab.icon]: true}" />
        <span class="tab-label"> {{ tab.label }}</span>
        <i class="closer icon icon-fw icon-x" @click.stop="close(tab.id)" />
      </div>
      <div
        class="resizer"
        @mousedown.prevent.stop="dragStart($event)"
        @touchstart.prevent.stop="dragStart($event)"
        @click="toggle"
      >
        <i class="icon icon-sort" />
      </div>
    </div>
    <div
      v-for="tab in tabs"
      :key="tab.id"
      class="body"
      :class="{'active': tab.id === active}"
    >
      <component
        :is="componentFor(tab)"
        :tab="tab"
        :active="tab.id === active"
        :height="reportedHeight"
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

        .closer {
          margin-left: 5px;
          border: 1px solid var(--body-text);
          border-radius: var(--border-radius);

          &:hover {
            background-color: var(--wm-closer-hover-bg);
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

      .resizer {
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
</style>
