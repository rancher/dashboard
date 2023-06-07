<script>
import CodeMirror from '@shell/components/CodeMirror';

export default {
  props: {
    value: {
      type:    String,
      default: ''
    },
  },
  data() {
    return {
      options: {
        mode:     'application/json',
        readOnly: true,
      }
    };
  },
  methods: {
    refresh() {
      this.$refs.codeMirror?.refresh();
    }
  },
  components: { CodeMirror }
};
</script>

<template>
  <div class="json-view">
    <CodeMirror
      ref="codeMirror"
      :value="value"
      :options="options"
    />
  </div>
</template>

<style lang="scss" scoped>
  .json-view {
    ::v-deep .code-mirror {
      .CodeMirror {
        background-color: var(--yaml-editor-bg);
        & .CodeMirror-gutters {
          background-color: var(--yaml-editor-bg);
        }
      }
    }
  }
</style>
