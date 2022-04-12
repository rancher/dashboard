<script>
import { KEYMAP } from '@/store/prefs';

export default {
  name:  'CodeMirror',
  props: {
    value: {
      type:     String,
      required: true,
    },
    options: {
      type:    Object,
      default: () => {}
    }
  },

  data() {
    return { loaded: false };
  },

  computed: {
    combinedOptions() {
      const theme = this.$store.getters['prefs/theme'];
      const keymap = this.$store.getters['prefs/get'](KEYMAP);

      const out = {
        // codemirror default options
        tabSize:                 2,
        indentWithTabs:          false,
        mode:                    'yaml',
        keyMap:                  keymap,
        theme:                   `base16-${ theme }`,
        lineNumbers:             true,
        line:                    true,
        styleActiveLine:         true,
        lineWrapping:            true,
        foldGutter:              true,
        styleSelectedText:       true,
        showCursorWhenSelecting: true,
      };

      Object.assign(out, this.options);

      return out;
    },
  },

  created() {
    if ( process.client ) {
      if (window.__codeMirrorLoader) {
        window.__codeMirrorLoader().then(() => {
          this.loaded = true;
        });
      } else {
        console.error('Code mirror loader not available'); // eslint-disable-line no-console
      }
    }
  },

  methods: {

    focus() {
      if ( this.$refs.cm ) {
        this.$refs.cm.codemirror.focus();
      }
    },

    refresh() {
      if ( this.$refs.cm ) {
        this.$refs.cm.refresh();
      }
    },

    onReady(cm) {
      this.$nextTick(() => {
        cm.refresh();
      });
      this.$emit('onReady', cm);
    },

    onInput(newCode) {
      this.$emit('onInput', newCode);
    },

    onChanges(cm, changes) {
      this.$emit('onChanges', cm, changes);
    },

    updateValue(value) {
      if ( this.$refs.cm ) {
        this.$refs.cm.codemirror.doc.setValue(value);
      }
    }
  }
};
</script>

<template>
  <client-only placeholder=" Loading...">
    <div class="code-mirror">
      <codemirror
        v-if="loaded"
        ref="cm"
        :value="value"
        :options="combinedOptions"
        @ready="onReady"
        @input="onInput"
        @changes="onChanges"
      />
      <div v-else>
        Loading...
      </div>
    </div>
  </client-only>
</template>

<style lang="scss">
  .code-mirror {
    z-index: 0;

    .vue-codemirror .CodeMirror {
      height: initial;
      background: none
    }
  }
</style>
