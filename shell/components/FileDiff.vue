<script>
import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui-slim.js';

import { createPatch } from 'diff';

export default {
  props: {
    filename: {
      type:    String,
      default: 'file.txt',
    },

    sideBySide: {
      type:    Boolean,
      default: false,
    },

    orig: {
      type:     String,
      required: true,
    },

    neu: {
      type:     String,
      required: true,
    },

    autoResize: {
      type:    Boolean,
      default: true,
    },
    footerSpace: {
      type:    Number,
      default: 0,
    },
    minHeight: {
      type:    Number,
      default: 200,
    }
  },

  mounted() {
    this.draw();
  },

  watch: {
    sideBySide() {
      this.draw();
    }
  },

  methods: {
    draw() {
      const targetElement = document.getElementById('diffElement');
      const patch = createPatch(
        this.filename,
        this.orig,
        this.neu
      );
      const configuration = {
        // UI
        synchronisedScroll: true,

        // Base
        outputFormat: this.sideBySide ? 'side-by-side' : 'line-by-line',
        drawFileList: false,
        matching:     'words',
      };

      const diff2htmlUi = new Diff2HtmlUI(targetElement, patch, configuration);

      diff2htmlUi.draw();
      this.fit();
    },

    fit() {
      if ( !this.autoResize ) {
        return;
      }

      const container = this.$refs.root;

      if ( !container ) {
        return;
      }

      const offset = container.getBoundingClientRect();

      if ( !offset ) {
        return;
      }

      const desired = window.innerHeight - offset.top - this.footerSpace;

      container.style.height = `${ Math.max(0, desired) }px`;
    },
  },
};
</script>

<template>
  <div>
    <resize-observer @notify="fit" />
    <div
      id="diffElement"
      ref="root"
      class="root"
    />
  </div>
</template>

<style lang="scss" scoped>
.root {
  max-width: 100%;
  position: relative;
  overflow: auto;
}
</style>

<style scoped lang="scss">
@import 'node_modules/diff2html/bundles/css/diff2html.min.css';

:deep() .d2h-wrapper {
  .d2h-file-header {
    display: none;
  }

  .d2h-file-wrapper {
    border-color: var(--diff-border);
  }

  .d2h-diff-table {
    font-family: Menlo,Consolas,monospace;
    font-size: 13px;
  }

  .d2h-emptyplaceholder, .d2h-code-side-emptyplaceholder {
    border-color: var(--diff-linenum-border);
    background-color: var(--diff-empty-placeholder);
  }

  .d2h-code-linenumber,
  .d2h-code-side-linenumber {
    background-color: var(--diff-linenum-bg);
    color: var(--diff-linenum);
    border-color: var(--diff-linenum-border);
    border-left: 0;
  }

  .d2h-code-line del,.d2h-code-side-line del {
    background-color: var(--diff-line-del-bg);
  }

  .d2h-code-line ins,.d2h-code-side-line ins {
    background-color: var(--diff-line-ins-bg);
  }

  .d2h-del {
    background-color: var(--diff-del-bg);
    border-color: var(--diff-del-border);
    color: var(--body-text);
  }

  .d2h-ins {
    background-color: var(--diff-ins-bg);
    border-color: var(--diff-ins-border);
    color: var(--body-text);
  }

  .d2h-info {
    background-color: var(--diff-header-bg);
    color: var(--diff-header);
    border-color: var(--diff-header-border);
  }

  .d2h-file-diff .d2h-del.d2h-change {
    background-color: var(--diff-chg-del);
  }

  .d2h-file-diff .d2h-ins.d2h-change {
    background-color: var(--diff-chg-ins);
  }
}
</style>
