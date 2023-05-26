<script>
import * as monaco from 'monaco-editor';

export default {
  name:  'Monaco',
  props: {
    value: {
      type:    String,
      default: ''
    },
  },
  data() {
    return {};
  },
  mounted() {
    monaco.editor.create(
      document.getElementById('container'),
      {
        value:           this.value,
        language:        'javascript',
        automaticLayout: true,
      }
    );
  }
};
</script>

<template>
  <div class="monaco">
    <h3 class="header">
      Monaco Editor
    </h3>
    <div
      id="container"
      style="height: 300px"
    />
  </div>
</template>

<style lang="scss" scoped>
  .monaco {
    .header {
      padding: 0 0 15px 20px;
    }
  }
</style>
