<script>
import YamlEditor from '@shell/components/YamlEditor';
export default {
  components: { YamlEditor },

  emits: ['additional-manifest-changed'],

  props: {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true,
    }
  },

  computed: {
    additionalManifest: {
      get() {
        return this.value.spec.rkeConfig.additionalManifest;
      },
      set(neu) {
        this.$emit('additional-manifest-changed', neu);
      }
    }
  }
};
</script>

<template>
  <div>
    <h3>
      {{ t('cluster.addOns.additionalManifest.title') }}
      <i
        v-clean-tooltip="t('cluster.addOns.additionalManifest.tooltip')"
        class="icon icon-info"
      />
    </h3>
    <YamlEditor
      ref="yaml-additional"
      v-model:value="additionalManifest"
      :editor-mode="mode === 'view' ? 'VIEW_CODE' : 'EDIT_CODE'"
      initial-yaml-values="# Additional Manifest YAML"
      class="yaml-editor"
    />
  </div>
</template>
