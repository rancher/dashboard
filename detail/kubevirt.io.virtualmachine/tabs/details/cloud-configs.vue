<script>
import YamlEditor, { EDITOR_MODES } from '@/components/YamlEditor';

export default {
  components: { YamlEditor },

  props: {
    value: {
      type:     Object,
      required: true
    },

    active: {
      type:     Boolean,
      required: false,
    }
  },

  data() {
    return { editorMode: EDITOR_MODES.VIEW_CODE };
  },

  computed: {
    cloudData() {
      const volumes = this.value?.spec?.template?.spec?.volumes;
      const out = {
        userData:    '',
        networkData: ''
      };

      volumes.forEach((v) => {
        if (v.cloudInitNoCloud) {
          out.userData = v.cloudInitNoCloud.userData || '';
          out.networkData = v.cloudInitNoCloud.networkData || '';
        }
      });

      return out;
    }
  },

  methods: {
    onReady(cm) {

    }
  },

};
</script>

<template>
  <div class="test">
    <div class="resource-yaml">
      <h3>{{ t('harvester.virtualMachine.cloudConfig.userData.title') }}</h3>
      <YamlEditor
        v-if="active"
        ref="yamlUser"
        v-model="cloudData.userData"
        class="yaml-editor"
        :editor-mode="editorMode"
        @onReady="onReady"
      />
      <hr class="section-divider" />
      <h3>{{ t('harvester.virtualMachine.cloudConfig.networkData.title') }}</h3>
      <YamlEditor
        v-if="active"
        ref="yamlUser"
        v-model="cloudData.networkData"
        class="yaml-editor"
        :editor-mode="editorMode"
      />
    </div>
  </div>
</template>

<style lang="scss">
$yaml-height: 200px;

.test {
  display: block;
}

.resource-yaml {
  flex: 1;
  display: flex;
  flex-direction: column;

  & .yaml-editor{
    flex: 1;
    min-height: $yaml-height;
    & .code-mirror .CodeMirror {
      position: initial;
      height: auto;
      min-height: $yaml-height;
    }
  }
}
</style>
