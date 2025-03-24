<script>

const HEADER_HEIGHT = 55;

export default {

  props: {
    loading: {
      type:     Boolean,
      required: false
    },
  },

  emits: ['close'],

  data() {
    return {
      isOpen:         false,
      definition:     undefined,
      busy:           true,
      error:          false,
      expandAll:      false,
      isResizing:     false,
      resizeLeft:     '',
      resizePosition: 'absolute',
      width:          '50%',
      right:          '-50%',
      breadcrumbs:    undefined,
      definitions:    {},
      noResource:     false,
      notFound:       false,
    };
  },

  mounted() {
    // console.log('SlideIn')
  },

  computed: {
    top() {
      const banner = document.getElementById('banner-header');
      let height = HEADER_HEIGHT;

      if (banner) {
        height += banner.clientHeight;
      }

      return `${ height }px`;
    },

    height() {
      return `calc(100vh - ${ this.top })`;
    }
  },

  methods: {
    open() {
      this.busy = true;
      this.isOpen = true;
      this.addCloseKeyHandler();
      this.right = '0';
    },

    close() {
      this.isOpen = false;
      this.removeCloseKeyHandler();
      this.right = `-${ this.width }`;
      this.$emit('close')
    },

    scrollTop() {
      this.$refs.main.$el.scrollTop = 0;
    },

    addCloseKeyHandler() {
      document.addEventListener('keyup', this.closeKeyHandler);
    },

    removeCloseKeyHandler() {
      document.removeEventListener('keyup', this.closeKeyHandler);
    },

    closeKeyHandler(e) {
      // if (e.keyCode === KEY.ESCAPE ) {
      //   this.close();
      // }
    },

    toggleAll() {
      this.expandAll = !this.expandAll;
    },

    startPanelResize(ev) {
      this.isResizing = true;
      this.$refs.resizer.setPointerCapture(ev.pointerId);
    },

    doPanelResize(ev) {
      if (this.isResizing) {
        this.resizePosition = 'fixed';
        this.resizeLeft = `${ ev.clientX }px`;
      }
    },

    endPanelResize(ev) {
      this.isResizing = false;
      this.$refs.resizer.releasePointerCapture(ev.pointerId);

      const width = window.innerWidth - ev.clientX + 2;

      this.resizePosition = 'absolute';
      this.resizeLeft = '';

      this.width = `${ width }px`;
    },
  }
};
</script>

<template>
  <div>
    <div
      class="slide-in-glass"
      :class="{ 'slide-in-glass-open': isOpen }"
      @click="close()"
    />
    <div
      class="slide-in"
      :class="{ 'slide-in-open': isOpen }"
      :style="{ width, right, top, height }"
      data-testid="slide-in-panel"
    >
      <div
        ref="resizer"
        class="panel-resizer"
        :style="{ position: resizePosition, left: resizeLeft }"
        @pointerdown="startPanelResize"
        @pointermove="doPanelResize"
        @pointerup="endPanelResize"
      />
      <div
        v-if="loading"
        class="loading panel-loading"
      >
        <div>
          <i class="icon icon-lg icon-spinner icon-spin" />
        </div>
      </div>
      <div
        v-else
        class="main-panel"
      >
        <div class="header">
          <div
            class="breadcrumbs"
          >
            <slot name="title" />
          </div>
          <i
            v-if="!busy && !noResource && definition"
            class="icon icon-sort mr-10"
            role="button"
            :aria-label="t('kubectl-explain.expandAll')"
            tabindex="0"
            @click="toggleAll()"
            @keydown.space.enter.stop.prevent="toggleAll()"
          />
          <i
            role="button"
            :aria-label="t('kubectl-explain.scrollToTop')"
            class="icon icon-close"
            data-testid="slide-in-panel-close"
            tabindex="0"
            @click="close()"
            @keydown.space.enter.stop.prevent="close()"
          />
        </div>
        <div class="body">
          <slot name="body" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $slidein-width: 50%;

  .scroll-title span:focus-visible {
    @include focus-outline;
    outline-offset: 2px;
  }

  .panel-resizer {
    position: absolute;
    height: 100%;
    border: 2px solid transparent;

    &:hover {
      border: 2px solid var(--primary);
      cursor: col-resize;
    }
  }

  .main-panel {
    padding-left: 4px;
    display: flex;
    flex-direction: column;
    overflow: auto;

    .select-resource {
      font-size: 16px;
      margin: 40px;
      text-align: center;

      > svg, i {
        margin-bottom: 20px;
        opacity: 0.5;
        height: 64px;
        width: 64px;
      }

      // Ensure the icon uses the correct color for the theme
      > svg {
        fill: var(--body-text);
      }

      > i {
        font-size: 64px;
      }
    }
  }

  .header {
    align-items: center;
    display: flex;
    padding: 4px;
    border-bottom: 1px solid var(--border);

    .breadcrumbs {
      display: flex;
      flex-wrap: wrap;

      .breadcrumb-link {
        color: var(--text);

        &:hover {
          color: var(--link);
        }
      }
    }

    > :first-child {
      flex: 1;
      font-weight: bold;
    }

    > i {
      padding: 8px;
      opacity: 0.7;

      &:hover {
        background-color: var(--primary);
        color: var(--primary-text);
        cursor: pointer;
        opacity: 1;
      }
    }
  }

  .loading {
    align-items: center;
    display: flex;
    flex: 1;
    justify-content: center;

    .icon-spinner {
      font-size: 24px;
    }
  }

  .glass {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
  }

  .slide-in {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    z-index: 2000;
    width: $slidein-width;
    background-color: var(--body-bg);
    right: -$slidein-width;
    transition: right 0.5s;
    border-left: 1px solid var(--border);
    border-top: 1px solid var(--border);
  }

  .slide-in-open {
    right: 0;
  }

  .explain-panel {
    padding: 10px;
  }

  .slide-in-glass {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      height :100vh;
      width: 100vw;

    &.slide-in-glass-open {
      background-color: var(--body-bg);
      display: block;
      opacity: 0.5;
      z-index: 1000;
    }
  }

  .panel-loading {
    margin-top: 20px;
  }
</style>
