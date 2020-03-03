<script>
import { mapState } from 'vuex';
import { screenRect, boundingRect } from '@/utils/position';

export default {
  data() {
    return { dragOffset: 0 };
  },

  computed: {
    ...mapState('wm', ['tabs', 'active', 'open', 'userHeight']),

    height: {
      get() {
        if ( process.server ) {
          return 0;
        }

        // @TODO remember across reloads, normalize to fit into current screen
        // const cached = window.localStorage.getItem('wm-height');

        if ( this.userHeight ) {
          return this.userHeight;
        }

        return 200;
      },

      set(val) {
        this.$store.commit('wm/setUserHeight', val);
        this.show();

        return val;
      },
    },
  },

  watch: {
    tabs() {
      if ( this.open ) {
        this.show();
      } else {
        this.hide();
      }
    },
  },

  mounted() {
    if ( this.open ) {
      this.show();
    } else {
      this.hide();
    }
  },

  methods: {
    toggle() {
      if ( this.open ) {
        this.hide();
      } else {
        this.show();
      }
    },

    switchTo(tab) {
      this.$store.commit('wm/setActive', tab);
    },

    show() {
      document.documentElement.style.setProperty('--wm-height', `${ this.height }px`);
      this.$store.commit('wm/setOpen', true);
    },

    hide() {
      if ( this.tabs.length ) {
        document.documentElement.style.setProperty('--wm-height', `calc(var(--wm-tab-height) + 2px)`);
      } else {
        document.documentElement.style.setProperty('--wm-height', '0');
      }

      this.$store.commit('wm/setOpen', false);
    },

    dragStart(event) {
      console.log('dragStart', event);

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

      console.log(offset, eventY, rect);

      this.dragOffset = offset;
    },

    dragMove(event) {
      const rect = screenRect();
      const eventY = event.screenY;

      const neu = rect.height - eventY - this.dragOffset;

      console.log(rect.height, '-', eventY, '-', this.dragOffset, '=', neu);
      this.height = neu;
    },

    dragEnd(event) {
      console.log('dragEnd', event);

      const doc = document.documentElement;

      doc.removeEventListener('mousemove', this.dragMove);
      doc.removeEventListener('touchmove', this.dragMove, true);
      doc.removeEventListener('mouseup', this.dragEnd);
      doc.removeEventListener('mouseleave', this.dragEnd);
      doc.removeEventListener('touchend touchcancel', this.dragEnd, true);
      doc.removeEventListener('touchstart', this.dragEnd, true);
    },

    close(tab) {
      this.$store.dispatch('wm/close', tab);
    },
  }
};
</script>

<template>
  <div class="windowmanager">
    <div ref="tabs" class="tabs">
      <div
        v-for="tab in tabs"
        :key="tab"
        class="tab"
        :class="{'active': tab === active}"
        @click="switchTo(tab)"
      >
        {{ tab }}
        <i class="closer icon icon-x" @click="close(tab)" />
      </div>
      <div
        class="collapser"
        @click="toggle"
        @mousedown.prevent.stop="dragStart($event)"
        @touchstart.prevent.stop="dragStart($event)"
      >
        <i class="icon" :class="{'icon-chevron-up': !open, 'icon-chevron-down': open}" />
      </div>
    </div>
    <div class="body">
      {{ active }} Body
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

    .tabs {
      grid-area: tabs;
      background-color: var(--wm-tabs-bg);
      border-top: 1px solid var(--wm-border);
      border-bottom: 1px solid var(--wm-border);

      display: flex;
      align-content: stretch;

      .tab {
        border-top: 1px solid var(--wm-border);
        border-right: 1px solid var(--wm-border);
        padding: 0 10px;
        line-height: var(--wm-tab-height);
        overflow: hidden;
        text-overflow: ellipsis;

        &.active {
          position: relative;
          background-color: var(--wm-body-bg);
          line-height: calc(var(--wm-tab-height) + 1px);
          z-index: 1;
        }
      }

      .collapser {
        width: var(--wm-tab-height);
        padding: 0 10px;
        text-align: center;
        border-left: 1px solid var(--wm-border);
        line-height: var(--wm-tab-height);
        height: calc(var(--wm-tab-height) + 1px);
        flex-grow: 0;
        cursor: pointer;
      }

      .closer {
        padding: 0 0 0 10px;

        &:hover {
          background-color: var(--wm-closer-hover-bg);
        }
      }
    }

    .body {
      grid-area: body;
      background-color: var(--wm-body-bg);
    }
  }
</style>
