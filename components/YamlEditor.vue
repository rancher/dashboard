<script>
import jsyaml from 'js-yaml';
import CodeMirror from './CodeMirror';
import FileDiff from './FileDiff';
import { mapPref, DIFF } from '@/store/prefs';

export const EDITOR_MODES = {
  EDIT_CODE: 'EDIT_CODE',
  VIEW_CODE: 'VIEW_CODE',
  DIFF_CODE: 'DIFF_CODE'
};

export default {
  components: {
    CodeMirror,
    FileDiff
  },
  props: {
    value: {
      type:     String,
      required:  true,
    },
    schema: {
      type:    Object,
      default: null,
    },
    editorMode: {
      type:      String,
      required:  true,
      validator(value) {
        return Object.values(EDITOR_MODES).includes(value);
      }
    },
    autoResize: {
      type:    Boolean,
      default: true,
    },
  },

  data() {
    return { original: this.value };
  },
  computed: {
    cmOptions() {
      const readOnly = this.editorMode === EDITOR_MODES.VIEW_CODE;
      const gutters = ['CodeMirror-lint-markers'];

      if ( !readOnly ) {
        gutters.push('CodeMirror-foldgutter');
      }

      return {
        readOnly,
        gutters,
        mode:            'yaml',
        lint:            true,
        lineNumbers:     !readOnly,
        extraKeys:       { 'Ctrl-Space': 'autocomplete' },
        cursorBlinkRate: ( readOnly ? -1 : 530 )
      };
    },
    isPreview() {
      return this.editorMode === EDITOR_MODES.DIFF_CODE;
    },
    diffMode: mapPref(DIFF),
    showCodeEditor() {
      return [EDITOR_MODES.EDIT_CODE, EDITOR_MODES.VIEW_CODE].includes(this.editorMode);
    }
  },
  watch: {
    value(newYaml) {
      try {
        const parsed = jsyaml.safeLoad(newYaml);

        this.$emit('newObject', parsed);
      } catch (ex) {}
    }
  },
  methods: {
    onInput() {
      this.$emit('input', ...arguments);
      this.$emit('onInput', ...arguments);
    },

    onReady() {
      this.$emit('onReady', ...arguments);
    },

    onChanges() {
      this.$emit('onChanges', ...arguments);
    },
  }
};
</script>

<template>
  <div class="yaml-editor">
    <div class="text-right">
      <span v-if="isPreview" v-trim-whitespace class="btn-group btn-sm diff-mode">
        <button
          type="button"
          class="btn btn-sm bg-default"
          :class="{'active': diffMode !== 'split'}"
          @click="diffMode='unified'"
        >Unified</button>
        <button
          type="button"
          class="btn btn-sm bg-default"
          :class="{'active': diffMode === 'split'}"
          @click="diffMode='split'"
        >Split</button>
      </span>
    </div>
    <CodeMirror
      v-if="showCodeEditor"
      class="fill"
      :value="value"
      :options="cmOptions"
      @onInput="onInput"
      @onReady="onReady"
      @onChanges="onChanges"
    />
    <FileDiff
      v-else
      class="fill"
      :filename="'.yaml'"
      :side-by-side="diffMode === 'split'"
      :orig="original"
      :neu="value"
    />
  </div>
</template>

<style lang="scss" scoped>
.yaml-editor {
  display: flex;
  flex-direction: column;

  .fill {
    flex: 1;
  }

  .diff-mode {
    background-color: var(--diff-header-bg);
    padding: 5px 5px;

    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
  }

  .d2h-file-wrapper {
    border-top-right-radius: 0;
  }
}
</style>
