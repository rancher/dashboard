<script>
import { Checkbox } from '@components/Form/Checkbox';
import { isTemplatingEnabled, toggleTemplating, fetchTemplatingConfigMaps } from '../templating/template-engine';

// AI Templating settings — the global kill switch for the custom Home. Always reachable (even when
// off) so the feature can be turned back on. Home templates are stored as labeled ConfigMaps and
// authored in the Home editor.
export default {
  name:       'AiTemplatingSettings',
  components: { Checkbox },

  async created() {
    await fetchTemplatingConfigMaps(this.$store).catch(() => {});
  },

  data() {
    return { toggling: false };
  },

  computed: {
    enabled() {
      return isTemplatingEnabled(this.$store.getters);
    },
  },

  methods: {
    async onToggle(value) {
      if (this.toggling) {
        return;
      }
      this.toggling = true;

      try {
        const now = await toggleTemplating(this.$store, value);

        this.$store.dispatch('growl/success', {
          title:   'AI templating',
          message: now ? 'Templating enabled.' : 'Templating disabled — showing stock Rancher.',
        }, { root: true });
      } catch (e) {
        this.$store.dispatch('growl/error', {
          title:   'Could not change templating',
          message: e?.message || String(e),
        }, { root: true });
      } finally {
        this.toggling = false;
      }
    },
  },
};
</script>

<template>
  <div class="ai-templating-settings">
    <h1 class="mb-10">
      AI Templating
    </h1>
    <p class="text-muted mb-20">
      The configurable Home and its templates are stored as labeled <code>ConfigMap</code>s and
      authored in the <b>Home</b> editor (with the AI assistant).
    </p>

    <div
      class="templating-switch"
      :class="{ 'templating-switch--off': !enabled }"
    >
      <Checkbox
        :value="enabled"
        :disabled="toggling"
        label="Custom Home templating enabled"
        @update:value="onToggle"
      />
      <p class="text-muted mt-5 mb-0">
        When off, Rancher ignores every Home template and behaves like stock Rancher. This page stays
        available so you can turn it back on.
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.templating-switch {
  border:        1px solid var(--border);
  border-radius: var(--border-radius);
  padding:       12px 16px;
  background:    var(--box-bg);
  max-width:     640px;

  &--off {
    border-color: var(--warning);
  }

  code {
    padding: 1px 4px;
  }
}
</style>
