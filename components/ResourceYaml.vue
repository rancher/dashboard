<script>

import CodeMirror from '~/components/CodeMirror';

const VIEW = 'view';
const EDIT = 'edit';
const PREVIEW = 'preview';

export default {
  components: { CodeMirror },

  props:      {
    defaultMode: {
      // The array of objects to show
      type:     String,
      default:  VIEW
    },

    obj: {
      type:     Object,
      required: true,
    },

    yaml: {
      type:     String,
      required: true,
    }
  },

  data() {
    return {
      mode:      this.defaultMode,
      cmOptions: {
        tabSize:                 2,
        styleActiveLine:         true,
        lineNumbers:             true,
        line:                    true,
        foldGutter:              true,
        styleSelectedText:       true,
        mode:                    'text/yaml',
        matchBrackets:           true,
        showCursorWhenSelecting: true,
        extraKeys:               { Ctrl: 'autocomplete' },
        hintOptions:             { completeSingle: false }
      }
    };
  },

};
</script>

<template>
  <CodeMirror :source="yaml" :options="cmOptions" />
</template>
