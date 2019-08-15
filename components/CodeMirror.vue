<template>
  <no-ssr v-if="autoResize" placeholder=" Loading...">
    <div>
      <resize-observer @notify="fit" />
      <codemirror
        ref="cm"
        v-model="source"
        :options="fullOptions"
        @ready="onCmReady"
        @focus="onCmFocus"
        @input="onCmCodeChange"
      />
    </div>
  </no-ssr>
</template>

<script>
import $ from 'jquery';

export default {
  props: {
    source: {
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

  data() {
    return {
      fullOptions: {
        // codemirror options
        tabSize:     2,
        mode:        'text/yaml',
        theme:       'base16-dark',
        lineNumbers: true,
        line:        true,

        ...this.options
      }
    };
  },
  computed: {
    codemirror() {
      return this.$refs.cm.codemirror;
    }
  },

  mounted() {
    console.log('mounted');
    this.fit();
    // console.log('this is current codemirror object', this.codemirror);
    // you can use this.codemirror to do something...
  },

  methods: {
    onCmReady(cm) {
      this.fit();
      console.log('the editor is readied!', cm);
    },
    onCmFocus(cm) {
      console.log('the editor is focus!', cm);
    },
    onCmCodeChange(newCode) {
      console.log('this is new code', newCode);
      this.code = newCode;
    },

    fit() {
      if ( this.autoResize ) {
        const container = $(this.$el);

        if ( !container || !container.length ) {
          return;
        }

        const offset = container.offset();

        if ( !offset ) {
          return;
        }

        const desired = $(window).height() - offset.top - this.footerSpace;

        container.css('height', Math.max(this.minHeight, desired));
        $('.CodeMirror', this.$el).css('height', '100%');
      }
    },
  }
};
</script>
