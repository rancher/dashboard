<script>
import { markRaw } from 'vue';

// The SFC loader (and its @shell component require.context + a couple of @components leaf
// imports) is loaded LAZILY inside recompile(), NOT statically. A static import pulls the
// require.context into this route chunk's synchronous init, tangling it with
// TemplateResourceList/TemplateOverview and breaking circular-dependency init order
// ("__WEBPACK_DEFAULT_EXPORT__ before initialization"). An async chunk keeps it isolated.

// Renders a code-kind custom view: compiles the .vue source (from a ConfigMap) at
// runtime and mounts it. Re-compiles when the source changes, so edits to the ConfigMap
// live-reload the page (the compiled component remounts). The compiled component runs in
// the app tree, so it can use this.$store / this.$route and any @shell component.
export default {
  name: 'TemplateCode',

  props: {
    source: {
      type:     String,
      required: true,
    },
  },

  data() {
    return {
      compiled: null,
      error:    null,
      loading:  true,
      styles:   [],
    };
  },

  watch: {
    source: {
      immediate: true,
      handler:   'recompile',
    },
  },

  beforeUnmount() {
    this.cleanupStyles();
  },

  methods: {
    async recompile() {
      this.loading = true;
      this.error = null;
      this.cleanupStyles();

      try {
        // Loaded here (not statically) so the compiler + component require.context live in
        // their own async chunk, isolated from the JSON-widget templates in this page.
        const { compileSFC } = await import(/* webpackChunkName: "custom-view-sfc" */ '../templating/sfc-loader');
        const { component, styles } = await compileSFC(this.source);

        // markRaw so Vue doesn't try to make the component definition reactive.
        this.compiled = markRaw(component);
        this.styles = styles;
      } catch (e) {
        // Log the whole error, not just the message. When a compile fails the useful part is the
        // STACK — which module actually blew up — and a failure inside the component registry's own
        // import graph shows up here as a confusing downstream symptom with no hint of the cause.
        // eslint-disable-next-line no-console
        console.error('[ai-templating] custom view failed to compile', e);
        this.error = e?.message || String(e);
        this.compiled = null;
      } finally {
        this.loading = false;
      }
    },

    cleanupStyles() {
      (this.styles || []).forEach((el) => el.remove());
      this.styles = [];
    },
  },
};
</script>

<template>
  <div class="template-code">
    <div
      v-if="error"
      class="text-error"
    >
      <h3 class="mb-10">
        Failed to compile custom view
      </h3>
      <pre>{{ error }}</pre>
    </div>
    <component
      :is="compiled"
      v-else-if="compiled"
    />
    <div
      v-else
      class="text-muted"
    >
      Compiling…
    </div>
  </div>
</template>

<style lang="scss" scoped>
.template-code {
  pre {
    white-space: pre-wrap;
  }
}
</style>
