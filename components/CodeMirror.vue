<script>

import $ from 'jquery';
import { THEME, KEYMAP } from '@/store/prefs';

export default {
  props: {
    value: {
      type:     String,
      required: true,
    },
    options: {
      type:    Object,
      default: () => {}
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

  computed: {
    codemirror() {
      return this.$refs.cm.codemirror;
    },

    combinedOptions() {
      const theme = this.$store.getters['prefs/get'](THEME);
      const keymap = this.$store.getters['prefs/get'](KEYMAP);

      const out = {
        // codemirror options
        tabSize:                 2,
        mode:                    'yaml',
        keyMap:                  keymap,
        theme:                   `base16-${ theme }`,
        lineNumbers:             true,
        line:                    true,
        viewportMargin:          Infinity,
        styleActiveLine:         true,
        lineWrapping:            true,
        foldGutter:              true,
        styleSelectedText:       true,
        showCursorWhenSelecting: true,

        ...this.options
      };

      return out;
    },
  },

  mounted() {
    return import('@/plugins/codemirror');
  },

  methods: {
    onReady(cm) {
      this.fit();
      this.$emit('onReady', cm);
    },

    onInput(newCode) {
      this.$emit('onInput', newCode);
    },

    onChanges(cm, changes) {
      this.$emit('onChanges', cm, changes);
    },

    fit() {
      if ( !this.autoResize ) {
        return;
      }

      const container = $(this.$refs.cm.$el);

      if ( !container || !container.length ) {
        return;
      }

      const offset = container.offset();

      if ( !offset ) {
        return;
      }

      const desired = $(window).height() - offset.top - this.footerSpace - 20;

      container.css('height', `${ Math.max(this.minHeight, desired) }px`);
    },
  }
};
</script>

<template>
  <no-ssr v-if="autoResize" placeholder=" Loading...">
    <div>
      <resize-observer @notify="fit" />
      <codemirror
        ref="cm"
        :value="value"
        :options="combinedOptions"
        @ready="onReady"
        @input="onInput"
        @changes="onChanges"
      />
    </div>
  </no-ssr>
</template>

<style lang="scss">
  .CodeMirror {
    height: 100%;
  }
</style>
