<script>
import $ from 'jquery';

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
      const out = {
        // codemirror options
        tabSize:                 2,
        mode:                    'text/yaml',
        theme:                   'base16-dark',
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

      console.log(out);

      return out;
    },
  },

  methods: {
    onCmReady(cm) {
      console.log('the editor is readied!', cm);
      this.fit();
    },

    onCmCodeChange(newCode) {
      this.$emit('onCodeChange', newCode);
    },

    fit() {
      console.log('fit');
      if ( this.autoResize ) {
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
      }
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
        @ready="onCmReady"
        @input="onCmCodeChange"
      />
    </div>
  </no-ssr>
</template>

<style lang="scss">
  .CodeMirror {
    height: 100%;
  }
</style>
